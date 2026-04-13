import os
import json
import uuid
import urllib.parse

DATABASE_URL = os.environ.get("DATABASE_URL")

try:
    if DATABASE_URL:
        import pg8000.dbapi
except ImportError:
    pass

import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "patients.db")

def _get_pg_conn():
    url = urllib.parse.urlparse(DATABASE_URL)
    user = url.username
    password = url.password
    host = url.hostname
    port = url.port
    database = url.path[1:]
    return pg8000.dbapi.connect(user=user, password=password, host=host, port=port, database=database)

def init_db():
    if DATABASE_URL:
        # Postgres Initialization via pg8000 (100% pure Python, no C-libpq)
        conn = _get_pg_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS patients (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        age TEXT,
                        vitals TEXT,
                        lastRiskScore REAL,
                        lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
            conn.commit()
        finally:
            conn.close()
    else:
        # Local SQLite Initialization
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS patients (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    age TEXT,
                    vitals TEXT,
                    lastRiskScore REAL
                )
            """)
            conn.commit()

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    
    if "vitals" in d and d["vitals"]:
        try:
            d["vitals"] = json.loads(d["vitals"])
        except:
            d["vitals"] = None
    return d

def _execute(query, params=(), fetch_all=False, fetch_one=False):
    """Abstraction layer handling SQLite vs Postgres syntax and cursors"""
    if DATABASE_URL:
        # Postgres flow
        conn = _get_pg_conn()
        # Convert SQLite ? bindings to Postgres %s
        pg_query = query.replace("?", "%s")
        try:
            with conn.cursor() as cur:
                cur.execute(pg_query, params)
                
                if not fetch_all and not fetch_one:
                    conn.commit()
                    return None
                    
                res = cur.fetchall() if fetch_all else cur.fetchone()
                
                # Fetch row description for dictionary binding
                columns = [col[0] for col in cur.description] if cur.description else []
                
                if fetch_all and res:
                    final_res = []
                    for row in res:
                        d = dict(zip(columns, row))
                        if "vitals" in d and d["vitals"]:
                            try: d["vitals"] = json.loads(d["vitals"])
                            except: d["vitals"] = None
                        final_res.append(d)
                    return final_res
                elif fetch_one and res:
                    d = dict(zip(columns, res))
                    if "vitals" in d and d["vitals"]:
                        try: d["vitals"] = json.loads(d["vitals"])
                        except: d["vitals"] = None
                    return d
                    
                return [] if fetch_all else None
        finally:
            conn.close()
    else:
        # Local SQLite flow
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = dict_factory
            cur = conn.cursor()
            cur.execute(query, params)
            if fetch_all: return cur.fetchall()
            if fetch_one: return cur.fetchone()
            conn.commit()

def get_all_patients():
    return _execute("SELECT * FROM patients ORDER BY id DESC", fetch_all=True)

def get_patient(p_id):
    return _execute("SELECT * FROM patients WHERE id = ?", (p_id,), fetch_one=True)

def create_patient(name, age):
    p_id = str(uuid.uuid4())
    _execute("INSERT INTO patients (id, name, age) VALUES (?, ?, ?)", (p_id, name, age))
    return get_patient(p_id)

def update_patient(p_id, updates):
    fields = []
    vals = []
    for k, v in updates.items():
        if k == "vitals":
            v = json.dumps(v) if v is not None else None
        fields.append(f"{k} = ?")
        vals.append(v)
        
    if not fields: return get_patient(p_id)
        
    vals.append(p_id)
    query = f"UPDATE patients SET {', '.join(fields)} WHERE id = ?"
    _execute(query, tuple(vals))
    return get_patient(p_id)

def delete_patient(p_id):
    _execute("DELETE FROM patients WHERE id = ?", (p_id,))
