"""
Test the Supabase database connection and the TeamMatch tables.

Prints no credentials or other sensitive information.
"""

from dotenv import load_dotenv

from database import get_connection

# Load environment variables
load_dotenv()

# The four TeamMatch tables
TABLES = ["profiles", "availability", "assignments", "group_members"]


def test_connection():
    """Test the database connection and check the four TeamMatch tables."""
    # 1. Test the connection
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT version()")
        version = cur.fetchone()[0]
        cur.close()
        conn.close()

        print("Database connection successful")
        print(f"Server: {version.split(',')[0]}")
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False

    # 2. Check the four TeamMatch tables
    try:
        conn = get_connection()
        cur = conn.cursor()

        found = 0
        for table in TABLES:
            cur.execute("""
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = %s
            """, (table,))
            if cur.fetchone():
                found += 1
                print(f"Table check passed: public.{table}")
            else:
                print(f"Table check failed: public.{table} is missing")

        cur.close()
        conn.close()

        print(f"TeamMatch tables: {found}/{len(TABLES)} found")
        return found == len(TABLES)
    except Exception as e:
        print(f"Table check failed: {e}")
        return False


if __name__ == "__main__":
    test_connection()
