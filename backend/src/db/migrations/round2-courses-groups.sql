-- ============================================================
-- Round 2 Migration: Courses, Group Leaders, Submission Types
-- Additive only. Safe to run on existing data.
-- ============================================================

-- ------------------------------------------------------------
-- 1. COURSES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(30) NOT NULL,
    description TEXT,
    professor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_courses_professor_id
ON courses(professor_id);

-- ------------------------------------------------------------
-- 2. COURSE ENROLLMENT (many-to-many: students <-> courses)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_students (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (course_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_course_students_course_id
ON course_students(course_id);

CREATE INDEX IF NOT EXISTS idx_course_students_student_id
ON course_students(student_id);

-- ------------------------------------------------------------
-- 3. ASSIGNMENTS: link to course + submission_type
-- ------------------------------------------------------------
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS course_id INTEGER
    REFERENCES courses(id) ON DELETE SET NULL;

ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS submission_type VARCHAR(20)
    NOT NULL DEFAULT 'individual';

ALTER TABLE assignments
DROP CONSTRAINT IF EXISTS assignments_submission_type_check;

ALTER TABLE assignments
ADD CONSTRAINT assignments_submission_type_check
    CHECK (submission_type IN ('individual', 'group'));

CREATE INDEX IF NOT EXISTS idx_assignments_course_id
ON assignments(course_id);

-- ------------------------------------------------------------
-- 4. GROUPS: leader
-- ------------------------------------------------------------
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS leader_id INTEGER
    REFERENCES users(id) ON DELETE SET NULL;

-- Backfill: existing groups use created_by as leader
UPDATE groups
SET leader_id = created_by
WHERE leader_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_groups_leader_id
ON groups(leader_id);

-- ------------------------------------------------------------
-- 5. SUBMISSIONS: track who confirmed (leader vs self)
-- ------------------------------------------------------------
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS confirmed_by INTEGER
    REFERENCES users(id) ON DELETE SET NULL;

-- Backfill: existing confirmations were self-confirmed
UPDATE submissions
SET confirmed_by = student_id
WHERE confirmed = true AND confirmed_by IS NULL;

-- ------------------------------------------------------------
-- 6. Helpful index for group-scoped submission lookups
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_group
ON submissions(assignment_id, group_id);