"""
CRUD Operations for TeamMatch Data

Database operations for TeamMatch data:
- profiles:      student profile (name, course, skills, preferences)
- availability:  weekly slots and meeting frequency
- assignments:   unit project assignment requirements
- group_members: members of a user's assignment group

Every function is scoped to the authenticated user's id (from the verified
Supabase token, never from the browser). Dictionaries use camelCase keys
to match the frontend data types.
"""

from typing import List, Optional

from psycopg2.extras import Json

from database import get_connection


# =====================================================
# ROW -> DICT CONVERTERS
# =====================================================
def _iso(value):
    """Format a date/timestamp as an ISO string, or None."""
    return value.isoformat() if value else None


def _profile_dict(row):
    return {
        "id": str(row[0]),
        "email": row[1],
        "name": row[2],
        "course": row[3],
        "skills": row[4] or [],
        "studyPreference": row[5],
        "commitment": row[6],
        "createdAt": _iso(row[7]),
        "updatedAt": _iso(row[8]),
    }


def _availability_dict(row):
    return {
        "userId": str(row[0]),
        "slots": row[1] or {},
        "meetingFrequency": row[2],
        "updatedAt": _iso(row[3]),
    }


def _assignment_dict(row):
    return {
        "id": row[0],
        "userId": str(row[1]),
        "unitCode": row[2],
        "projectName": row[3],
        "groupSize": row[4],
        "dueDate": _iso(row[5]),
        "requiredSkills": row[6] or [],
        "meetingPreference": row[7],
        "minimumCommitment": row[8],
        "createdAt": _iso(row[9]),
    }


def _group_member_dict(row):
    return {
        "id": row[0],
        "userId": str(row[1]),
        "assignmentId": row[2],
        "memberId": row[3],
        "memberName": row[4],
        "createdAt": _iso(row[5]),
    }


# =====================================================
# PROFILES
# =====================================================
def get_profile(user_id: str) -> Optional[dict]:
    """
    Get the profile row for a user.

    Args:
        user_id: Supabase Auth user ID (from the verified token)

    Returns:
        Dictionary with profile data, or None if not found
    """
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, email, name, course, skills, study_preference,
                   commitment, created_at, updated_at
            FROM profiles
            WHERE id = %s
        """, (user_id,))
        row = cur.fetchone()
        return _profile_dict(row) if row else None
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


def ensure_profile(user_id: str, email: Optional[str] = None) -> None:
    """
    Make sure a profile row exists for a user.

    The signup trigger normally creates the row; this is a safety net so
    foreign keys (availability, assignments) always have a parent row.

    Args:
        user_id: Supabase Auth user ID (from the verified token)
        email: User's email from Supabase Auth (optional)
    """
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO profiles (id, email)
            VALUES (%s, %s)
            ON CONFLICT (id) DO NOTHING
        """, (user_id, email))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


def upsert_profile(
    user_id: str,
    email: Optional[str],
    name: str,
    course: str,
    skills: List[str],
    study_preference: str,
    commitment: str
) -> dict:
    """
    Create or update the profile row for a user.

    Uses INSERT ... ON CONFLICT (id) DO UPDATE so it works even when the
    profiles row does not exist yet. The email is always taken from the
    authenticated user (Supabase Auth), never from the request body.

    Args:
        user_id: Supabase Auth user ID (from the verified token)
        email: User's email from Supabase Auth
        name: User's full name
        course: User's course or degree
        skills: List of skills
        study_preference: 'Online' | 'In-person' | 'Either'
        commitment: 'Casual' | 'Moderate' | 'Highly committed'

    Returns:
        Dictionary with the saved profile data
    """
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO profiles (id, email, name, course, skills, study_preference, commitment)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                email = COALESCE(EXCLUDED.email, profiles.email),
                name = EXCLUDED.name,
                course = EXCLUDED.course,
                skills = EXCLUDED.skills,
                study_preference = EXCLUDED.study_preference,
                commitment = EXCLUDED.commitment,
                updated_at = NOW()
            RETURNING id, email, name, course, skills, study_preference,
                      commitment, created_at, updated_at
        """, (user_id, email, name, course, skills, study_preference, commitment))
        row = cur.fetchone()
        conn.commit()
        return _profile_dict(row)
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


# =====================================================
# AVAILABILITY
# =====================================================
def get_availability(user_id: str) -> Optional[dict]:
    """
    Get the availability row for a user.

    Args:
        user_id: Supabase Auth user ID (from the verified token)

    Returns:
        Dictionary with availability data, or None if not found
    """
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT user_id, slots, meeting_frequency, updated_at
            FROM availability
            WHERE user_id = %s
        """, (user_id,))
        row = cur.fetchone()
        return _availability_dict(row) if row else None
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


def upsert_availability(user_id: str, slots: dict, meeting_frequency: str) -> dict:
    """
    Create or update the availability row for a user.

    Args:
        user_id: Supabase Auth user ID (from the verified token)
        slots: Weekly slots as a JSON object, e.g. {"Monday": ["10:00"]}
        meeting_frequency: 'Once a week' | '2-3 times a week' | 'Flexible'

    Returns:
        Dictionary with the saved availability data
    """
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO availability (user_id, slots, meeting_frequency)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                slots = EXCLUDED.slots,
                meeting_frequency = EXCLUDED.meeting_frequency,
                updated_at = NOW()
            RETURNING user_id, slots, meeting_frequency, updated_at
        """, (user_id, Json(slots), meeting_frequency))
        row = cur.fetchone()
        conn.commit()
        return _availability_dict(row)
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


# =====================================================
# ASSIGNMENTS
# =====================================================
def create_assignment(
    user_id: str,
    unit_code: str,
    project_name: str,
    group_size: int,
    due_date,
    required_skills: List[str],
    meeting_preference: str,
    minimum_commitment: str
) -> dict:
    """
    Create a new assignment for a user.

    Args:
        user_id: Supabase Auth user ID (from the verified token)
        unit_code: Unit or subject code
        project_name: Assignment / project name
        group_size: Required group size
        due_date: Due date (date object)
        required_skills: List of required skills
        meeting_preference: 'Online' | 'In person' | 'Both'
        minimum_commitment: 'Low' | 'Moderate' | 'High'

    Returns:
        Dictionary with the created assignment data
    """
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO assignments (
                user_id, unit_code, project_name, group_size, due_date,
                required_skills, meeting_preference, minimum_commitment
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, user_id, unit_code, project_name, group_size, due_date,
                      required_skills, meeting_preference, minimum_commitment, created_at
        """, (
            user_id, unit_code, project_name, group_size, due_date,
            required_skills, meeting_preference, minimum_commitment
        ))
        row = cur.fetchone()
        conn.commit()
        return _assignment_dict(row)
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


def get_latest_assignment(user_id: str) -> Optional[dict]:
    """
    Get the most recent assignment for a user.

    Args:
        user_id: Supabase Auth user ID (from the verified token)

    Returns:
        Dictionary with assignment data, or None if the user has none
    """
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, user_id, unit_code, project_name, group_size, due_date,
                   required_skills, meeting_preference, minimum_commitment, created_at
            FROM assignments
            WHERE user_id = %s
            ORDER BY created_at DESC, id DESC
            LIMIT 1
        """, (user_id,))
        row = cur.fetchone()
        return _assignment_dict(row) if row else None
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


def get_assignment_if_owned(user_id: str, assignment_id: int) -> Optional[dict]:
    """
    Get an assignment only if it belongs to the user.

    Args:
        user_id: Supabase Auth user ID (from the verified token)
        assignment_id: Assignment ID

    Returns:
        Dictionary with assignment data, or None if not found / not owned
    """
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, user_id, unit_code, project_name, group_size, due_date,
                   required_skills, meeting_preference, minimum_commitment, created_at
            FROM assignments
            WHERE id = %s AND user_id = %s
        """, (assignment_id, user_id))
        row = cur.fetchone()
        return _assignment_dict(row) if row else None
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


# =====================================================
# GROUP MEMBERS
# =====================================================
def create_group_members(user_id: str, assignment_id: int, members: List[dict]) -> List[dict]:
    """
    Add members to one of the user's assignments.

    Args:
        user_id: Supabase Auth user ID (from the verified token)
        assignment_id: Assignment the members belong to (must be owned)
        members: List of {"memberId": str, "memberName": str}

    Returns:
        List of dictionaries with the created group member rows
    """
    conn = get_connection()
    try:
        cur = conn.cursor()
        rows = []
        for member in members:
            cur.execute("""
                INSERT INTO group_members (user_id, assignment_id, member_id, member_name)
                VALUES (%s, %s, %s, %s)
                RETURNING id, user_id, assignment_id, member_id, member_name, created_at
            """, (user_id, assignment_id, member["memberId"], member["memberName"]))
            rows.append(_group_member_dict(cur.fetchone()))
        conn.commit()
        return rows
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


def get_group_members(user_id: str, assignment_id: int) -> List[dict]:
    """
    Get the group members of one of the user's assignments.

    Args:
        user_id: Supabase Auth user ID (from the verified token)
        assignment_id: Assignment ID

    Returns:
        List of dictionaries with group member data
    """
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, user_id, assignment_id, member_id, member_name, created_at
            FROM group_members
            WHERE user_id = %s AND assignment_id = %s
            ORDER BY id
        """, (user_id, assignment_id))
        rows = cur.fetchall()
        return [_group_member_dict(row) for row in rows]
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

