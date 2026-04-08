import os
import json
import uuid

DATABASE_URL = os.environ.get("DATABASE_URL")

# Try to import psycopg2 dynamically depending on environment
try:
    if DATABASE_URL:
        import psycopg2
        import psycopg2.extras
except ImportError:
    pass

import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "patients.db")

def init_db():
    if DATABASE_URL:
        # Postgres Initialization
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
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
        conn = psycopg2.connect(DATABASE_URL)
        # Convert SQLite ? bindings to Postgres %s
        pg_query = query.replace("?", "%s")
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(pg_query, params)
                
                # Psycopg2 requires explicit commits for inserts/updates
                if not fetch_all and not fetch_one:
                    conn.commit()
                    return None
                    
                res = cur.fetchall() if fetch_all else cur.fetchone()
                
                # Parse vitals manually since psycopg2 doesn't use dict_factory
                if res and type(res) == list:
                    for d in res:
                        if "vitals" in d and d["vitals"]:
                            try: d["vitals"] = json.loads(d["vitals"])
                            except: d["vitals"] = None
                elif res and type(res) == dict:
                    if "vitals" in res and res["vitals"]:
                        try: res["vitals"] = json.loads(res["vitals"])
                        except: res["vitals"] = None
                        
                return res
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
    # Postgres doesn't order cleanly without a timestamp if just inserting, but ID falls back ok.
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
