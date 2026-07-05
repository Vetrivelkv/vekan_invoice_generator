import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# We need the direct postgres connection for DDL statements.
DB_HOST = "aws-0-ap-south-1.pooler.supabase.com"
DB_PORT = "6543"
DB_NAME = "postgres"
DB_USER = "postgres.ssbwwoqhaiooyymbfrub"
DB_PASSWORD = "19972002@VkKeyan"

def run_migrations():
    print("Starting automated database migrations...")
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Create schema_migrations table to track what we've run
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version TEXT PRIMARY KEY,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
            );
        """)
        
        migrations_dir = os.path.join(os.path.dirname(__file__), "migrations")
        
        # Read and apply migrations in order
        if os.path.exists(migrations_dir):
            scripts = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.sql')])
            for script_name in scripts:
                cursor.execute("SELECT version FROM schema_migrations WHERE version = %s", (script_name,))
                if not cursor.fetchone():
                    print(f"Applying migration: {script_name}")
                    script_path = os.path.join(migrations_dir, script_name)
                    with open(script_path, "r", encoding="utf-8") as f:
                        sql = f.read()
                        try:
                            cursor.execute(sql)
                            cursor.execute("INSERT INTO schema_migrations (version) VALUES (%s)", (script_name,))
                            print(f"Successfully applied {script_name}")
                        except Exception as e:
                            print(f"Error applying {script_name}: {e}")
                            break
                else:
                    print(f"Migration {script_name} already applied, skipping.")
        
        cursor.close()
        conn.close()
        print("Migrations complete.")
    except Exception as e:
        print(f"Failed to connect to database or run migrations: {e}")

if __name__ == "__main__":
    run_migrations()
