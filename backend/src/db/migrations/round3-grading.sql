
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS max_score INTEGER NOT NULL DEFAULT 100;

ALTER TABLE assignments
DROP CONSTRAINT IF EXISTS assignments_max_score_check;

ALTER TABLE assignments
ADD CONSTRAINT assignments_max_score_check
    CHECK (max_score > 0);



CREATE TABLE IF NOT EXISTS grades (
    id             SERIAL PRIMARY KEY,
    assignment_id  INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    submission_id  INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    group_id       INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    student_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    score          NUMERIC(6,2) NOT NULL,
    feedback       TEXT,
    graded_by      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    graded_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT grades_score_non_negative CHECK (score >= 0),
    CONSTRAINT grades_target_check CHECK (
        (student_id IS NOT NULL) OR (group_id IS NOT NULL)
    )
);


CREATE UNIQUE INDEX IF NOT EXISTS uq_grades_individual
    ON grades(assignment_id, student_id)
    WHERE group_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_grades_group_common
    ON grades(assignment_id, group_id)
    WHERE student_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_grades_group_override
    ON grades(assignment_id, group_id, student_id)
    WHERE student_id IS NOT NULL;


CREATE INDEX IF NOT EXISTS idx_grades_assignment_id
    ON grades(assignment_id);

CREATE INDEX IF NOT EXISTS idx_grades_submission_id
    ON grades(submission_id);

CREATE INDEX IF NOT EXISTS idx_grades_group_id
    ON grades(group_id);

CREATE INDEX IF NOT EXISTS idx_grades_student_id
    ON grades(student_id);

CREATE INDEX IF NOT EXISTS idx_grades_graded_by
    ON grades(graded_by);