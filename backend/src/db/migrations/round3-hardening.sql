
CREATE INDEX IF NOT EXISTS idx_grades_assignment_submission
    ON grades(assignment_id, submission_id);

ALTER TABLE assignments
DROP CONSTRAINT IF EXISTS assignments_submission_type_check;

ALTER TABLE assignments
ADD CONSTRAINT assignments_submission_type_check
    CHECK (submission_type IN ('individual', 'group'));

-- 3. Prevent max_score <= 0 (already but idempotent)
ALTER TABLE assignments
DROP CONSTRAINT IF EXISTS assignments_max_score_check;

ALTER TABLE assignments
ADD CONSTRAINT assignments_max_score_check
    CHECK (max_score > 0);

-- 4. Prevent grades.score > 100 hard cap (defense in depth)
ALTER TABLE grades
DROP CONSTRAINT IF EXISTS grades_score_upper_check;

ALTER TABLE grades
ADD CONSTRAINT grades_score_upper_check
    CHECK (score <= 1000);


ALTER TABLE grades
ALTER COLUMN submission_id SET NOT NULL;