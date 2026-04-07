import sqlite3
import json
import uuid
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "patients.db")

def init_db():
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
    
    # attempt to parse vitals if present
    if "vitals" in d and d["vitals"]:
        try:
            d["vitals"] = json.loads(d["vitals"])
        except:
            d["vitals"] = None
    return d

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = dict_factory
    return conn

def get_all_patients():
    with get_connection() as conn:
        return conn.execute("SELECT * FROM patients ORDER BY id DESC").fetchall()

def get_patient(p_id):
    with get_connection() as conn:
        res = conn.execute("SELECT * FROM patients WHERE id = ?", (p_id,)).fetchone()
        return res

def create_patient(name, age):
    p_id = str(uuid.uuid4())
    with get_connection() as conn:
        conn.execute("INSERT INTO patients (id, name, age) VALUES (?, ?, ?)", (p_id, name, age))
        conn.commit()
    return get_patient(p_id)

def update_patient(p_id, updates):
    with get_connection() as conn:
        # Build dynamic query
        fields = []
        vals = []
        for k, v in updates.items():
            if k == "vitals":
                v = json.dumps(v) if v is not None else None
            fields.append(f"{k} = ?")
            vals.append(v)
            
        if not fields:
            return get_patient(p_id)
            
        vals.append(p_id)
        query = f"UPDATE patients SET {', '.join(fields)} WHERE id = ?"
        conn.execute(query, tuple(vals))
        conn.commit()
    return get_patient(p_id)

def delete_patient(p_id):
    with get_connection() as conn:
        conn.execute("DELETE FROM patients WHERE id = ?", (p_id,))
        conn.commit()
