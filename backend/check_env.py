"""
Environment configuration shape check (prints NO secret values).

Verifies that SUPABASE_URL, SUPABASE_ANON_KEY and DATABASE_URL are set and
that DATABASE_URL uses the format Supabase expects. Only booleans and
generic format hints are printed - never any configured value.
"""

import os
from urllib.parse import urlparse

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

# Characters that must be percent-encoded in a URL password
NEEDS_ENCODING = set("@:/?#[]%&=+$,;")


def mark(ok: bool) -> str:
    return "OK     " if ok else "PROBLEM"


print("Environment shape check (no values are printed)")
print("-" * 55)
print(f"[{mark(bool(SUPABASE_URL))}] SUPABASE_URL is set")
print(f"[{mark(bool(SUPABASE_ANON_KEY))}] SUPABASE_ANON_KEY is set")
print(f"[{mark(bool(DATABASE_URL))}] DATABASE_URL is set")

if not DATABASE_URL:
    raise SystemExit(1)

url = urlparse(DATABASE_URL)
host = url.hostname or ""
user = url.username or ""
password = url.password or ""
database = (url.path or "").lstrip("/")

print(f"[{mark(url.scheme in ('postgresql', 'postgres'))}] DATABASE_URL starts with postgresql://")

is_pooler = "pooler.supabase.com" in host
is_direct = host.endswith(".supabase.co")
print(f"[{mark(is_pooler or is_direct)}] host looks like a Supabase database host")

if is_pooler:
    print(f"[{mark(user.startswith('postgres.'))}] pooler username has the postgres.<project-ref> form")
    if user == "postgres":
        print("       Hint: the Supabase pooler needs username postgres.<project-ref>,")
        print("       e.g. postgres.abcdefghijklmn - see Dashboard > Settings > Database")
        print("       > Connection string > Session pooler > URI")

if is_pooler and user.startswith("postgres."):
    user_ref = user.split(".", 1)[1]
    supa_ref = (urlparse(SUPABASE_URL).hostname or "").split(".")[0] if SUPABASE_URL else ""
    print(f"[{mark(bool(supa_ref) and user_ref == supa_ref)}] project-ref in username matches SUPABASE_URL")

print(f"[{mark(bool(password))}] DATABASE_URL contains a password")
has_bad_chars = any(ch in NEEDS_ENCODING for ch in password)
print(f"[{mark(not has_bad_chars)}] password needs no URL-encoding")
if has_bad_chars:
    print("       Hint: if the password contains special characters they must be")
    print("       percent-encoded inside the URL (e.g. @ -> %40, # -> %23)")

print(f"[{mark(database == 'postgres')}] database name is 'postgres'")
print("-" * 55)
print("If every line is OK but login still fails, the stored password is")
print("wrong: reset it in Supabase Dashboard > Settings > Database > Reset")
print("database password, then paste the new connection string here.")
