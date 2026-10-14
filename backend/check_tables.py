"""
Check that all four TeamMatch tables exist in Supabase.

Prints each table's columns, triggers and RLS policies, then a summary:
"✅ All four tables found: profiles, availability, assignments, group_members"
"""

from dotenv import load_dotenv

from database import get_connection

# Load environment variables
load_dotenv()

# The four TeamMatch tables
TABLES = ["profiles", "availability", "assignments", "group_members"]


def check_tables():
    """Check that the four TeamMatch tables exist and print their details."""
    found = []
    missing = []

    try:
        conn = get_connection()
        cur = conn.cursor()

        for table in TABLES:
            # Check if the table exists
            cur.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = %s
            """, (table,))
            result = cur.fetchone()

            if not result:
                missing.append(table)
                print(f"Table not found: {table}")
                continue

            found.append(table)
            print(f"Table found: public.{result[0]}")

            # Columns
            cur.execute("""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = %s
                ORDER BY ordinal_position
            """, (table,))
            columns = cur.fetchall()
            print("\nColumns:")
            for col in columns:
                print(f"  - {col[0]} ({col[1]})")

            # Triggers
            cur.execute("""
                SELECT trigger_name, event_manipulation, action_statement
                FROM information_schema.triggers
                WHERE event_object_table = %s
            """, (table,))
            triggers = cur.fetchall()
            if triggers:
                print("\nTriggers:")
                for trigger in triggers:
                    print(f"  - {trigger[0]} ({trigger[1]})")

            # RLS policies
            cur.execute("""
                SELECT policyname, cmd, qual
                FROM pg_policies
                WHERE tablename = %s
            """, (table,))
            policies = cur.fetchall()
            if policies:
                print("\nRLS Policies:")
                for policy in policies:
                    print(f"  - {policy[0]} ({policy[1]})")

            print()

        cur.close()
        conn.close()

        # Summary
        if len(found) == len(TABLES):
            print(f"✅ All four tables found: {', '.join(found)}")
        else:
            print(f"❌ Missing tables: {', '.join(missing)}")

    except Exception as e:
        print(f"Error checking tables: {e}")


if __name__ == "__main__":
    check_tables()
