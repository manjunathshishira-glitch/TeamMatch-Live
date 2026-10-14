import os
import re
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_connection():
    """Get a connection to the Supabase PostgreSQL database."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL not found in environment variables")
    
    conn = psycopg2.connect(database_url)
    return conn


def _parse_sql_statements(sql_script: str) -> list:
    """
    Parse SQL script into individual statements, correctly handling
    dollar-quoted strings ($func$...$func$) and comment blocks.
    
    Args:
        sql_script: The full SQL script content
    
    Returns:
        List of individual SQL statement strings (non-empty, non-comment-only)
    """
    statements = []
    current = []
    in_dollar_quote = False
    dollar_tag = ""
    i = 0
    
    while i < len(sql_script):
        char = sql_script[i]
        
        # Check for start/end of dollar-quoted string
        if not in_dollar_quote and char == '$':
            # Match dollar tag (e.g., $func$, $body$, $$)
            match = re.match(r'\$([a-zA-Z_]*)\$', sql_script[i:])
            if match:
                dollar_tag = match.group(0)
                in_dollar_quote = True
                current.append(dollar_tag)
                i += len(dollar_tag)
                continue
        elif in_dollar_quote and char == '$':
            # Check if this closes the dollar quote
            if sql_script[i:i + len(dollar_tag)] == dollar_tag:
                in_dollar_quote = False
                current.append(dollar_tag)
                i += len(dollar_tag)
                dollar_tag = ""
                continue
        
        # Handle line comments (-- ...)
        if not in_dollar_quote and char == '-' and i + 1 < len(sql_script) and sql_script[i + 1] == '-':
            # Skip to end of line
            end_of_line = sql_script.find('\n', i)
            if end_of_line == -1:
                end_of_line = len(sql_script)
            # Don't add comments to the current statement
            i = end_of_line + 1
            continue
        
        # Handle block comments (/* ... */)
        if not in_dollar_quote and char == '/' and i + 1 < len(sql_script) and sql_script[i + 1] == '*':
            end_comment = sql_script.find('*/', i + 2)
            if end_comment == -1:
                end_comment = len(sql_script)
            i = end_comment + 2
            continue
        
        # Statement separator (semicolon outside dollar quotes)
        if not in_dollar_quote and char == ';':
            stmt = ''.join(current).strip()
            if stmt:
                statements.append(stmt)
            current = []
            i += 1
            continue
        
        current.append(char)
        i += 1
    
    # Handle any remaining content (no trailing semicolon)
    stmt = ''.join(current).strip()
    if stmt:
        statements.append(stmt)
    
    return statements


def init_database():
    """
    Initialize the database by running SQL scripts on every startup.
    
    The SQL script is fully idempotent (uses IF NOT EXISTS, DROP IF EXISTS,
    CREATE OR REPLACE), so it's safe to run repeatedly.
    
    Statements are executed individually so that:
    - Each statement succeeds or fails independently
    - We get clear logging about what ran and what didn't
    - A failure in one statement doesn't block the rest
    """
    sql_file_path = os.path.join(os.path.dirname(__file__), "sql", "init.sql")
    with open(sql_file_path, "r") as f:
        sql_script = f.read()
    
    statements = _parse_sql_statements(sql_script)
    
    if not statements:
        print("⚠️  No SQL statements found in init.sql")
        return
    
    conn = get_connection()
    try:
        cur = conn.cursor()
        succeeded = 0
        skipped = 0
        failed = 0
        
        for i, stmt in enumerate(statements, 1):
            try:
                cur.execute(stmt)
                conn.commit()
                succeeded += 1
            except psycopg2.errors.DuplicateTable:
                conn.rollback()
                skipped += 1
            except psycopg2.errors.DuplicateObject:
                conn.rollback()
                skipped += 1
            except Exception as e:
                conn.rollback()
                failed += 1
                # Show first 80 chars of the failing statement for debugging
                snippet = stmt[:80].replace('\n', ' ')
                print(f"⚠️  Statement {i} failed: {e}")
                print(f"   SQL: {snippet}...")
        
        cur.close()
        
        total = len(statements)
        if failed == 0:
            print(f"✅ Database initialization completed ({succeeded} succeeded, {skipped} already existed, {total} total)")
        else:
            print(f"⚠️  Database initialization finished with warnings ({succeeded} succeeded, {skipped} skipped, {failed} failed, {total} total)")
    finally:
        conn.close()


if __name__ == "__main__":
    init_database()
