-- =====================================================
-- TeamMatch Database Schema
-- For Supabase PostgreSQL with Auth Integration
-- Tables: profiles, availability, assignments, group_members
-- Fully idempotent: safe to run on every backend startup
-- =====================================================

-- 1. profiles table
-- One row per user. id = Supabase Auth user id.
-- The row is created automatically by a trigger when a user signs up.
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    email TEXT,
    name TEXT,
    course TEXT,
    skills TEXT[] DEFAULT '{}',
    study_preference TEXT,
    commitment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. availability table
-- One row per user (user_id is the primary key)
CREATE TABLE IF NOT EXISTS availability (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    slots JSONB DEFAULT '{}'::jsonb,
    meeting_frequency TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. assignments table
-- A user can have many assignments (one per unit project)
CREATE TABLE IF NOT EXISTS assignments (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    unit_code TEXT NOT NULL,
    project_name TEXT NOT NULL,
    group_size INT NOT NULL,
    due_date DATE,
    required_skills TEXT[] DEFAULT '{}',
    meeting_preference TEXT,
    minimum_commitment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. group_members table
-- Members of a user's assignment group
CREATE TABLE IF NOT EXISTS group_members (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assignment_id BIGINT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL,
    member_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) on all four tables
-- This ensures users can only access their own data
-- ALTER TABLE ENABLE is idempotent in PostgreSQL
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- DROP IF EXISTS + CREATE ensures idempotency (CREATE POLICY has no IF NOT EXISTS)

-- profiles: users can only access their own profile row
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
CREATE POLICY "Users can delete own profile"
    ON profiles FOR DELETE USING (auth.uid() = id);

-- availability: users can only access their own availability row
DROP POLICY IF EXISTS "Users can view own availability" ON availability;
CREATE POLICY "Users can view own availability"
    ON availability FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own availability" ON availability;
CREATE POLICY "Users can insert own availability"
    ON availability FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own availability" ON availability;
CREATE POLICY "Users can update own availability"
    ON availability FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own availability" ON availability;
CREATE POLICY "Users can delete own availability"
    ON availability FOR DELETE USING (auth.uid() = user_id);

-- assignments: users can only access their own assignments
DROP POLICY IF EXISTS "Users can view own assignments" ON assignments;
CREATE POLICY "Users can view own assignments"
    ON assignments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own assignments" ON assignments;
CREATE POLICY "Users can insert own assignments"
    ON assignments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own assignments" ON assignments;
CREATE POLICY "Users can update own assignments"
    ON assignments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own assignments" ON assignments;
CREATE POLICY "Users can delete own assignments"
    ON assignments FOR DELETE USING (auth.uid() = user_id);

-- group_members: users can only access their own group members
DROP POLICY IF EXISTS "Users can view own group members" ON group_members;
CREATE POLICY "Users can view own group members"
    ON group_members FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own group members" ON group_members;
CREATE POLICY "Users can insert own group members"
    ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own group members" ON group_members;
CREATE POLICY "Users can update own group members"
    ON group_members FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own group members" ON group_members;
CREATE POLICY "Users can delete own group members"
    ON group_members FOR DELETE USING (auth.uid() = user_id);

-- 7. Function to automatically update updated_at timestamp
-- CREATE OR REPLACE ensures idempotency
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- 8. Triggers to maintain updated_at on row modification
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_availability_updated_at ON availability;
CREATE TRIGGER update_availability_updated_at
    BEFORE UPDATE ON availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Function to handle new user signup
-- Creates a profile row automatically when a user signs up via Supabase Auth
-- CREATE OR REPLACE ensures idempotency
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $func$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        TRIM(CONCAT(
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            ' ',
            COALESCE(NEW.raw_user_meta_data->>'last_name', '')
        ))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Trigger on auth.users for automatic profile creation
-- This trigger fires after a new user is created in Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- NOTES:
-- - Fully idempotent: safe to run on every backend startup
-- - Uses DROP IF EXISTS before CREATE for objects that lack IF NOT EXISTS
-- - Uses CREATE OR REPLACE for functions
-- - Uses CREATE TABLE IF NOT EXISTS for tables
-- - RLS policies ensure data isolation between users (auth.uid())
-- - The trigger automatically creates a profile row on signup
-- - The updated_at column is automatically maintained
-- =====================================================
