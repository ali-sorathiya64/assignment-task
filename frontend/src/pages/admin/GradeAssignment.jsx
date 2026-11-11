import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { gradingApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import { initials } from "../../api/format.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States.jsx";
import { useToast } from "../../context/ToastContext.jsx";

const hasValue = (v) => v !== null && v !== undefined;

const validateScore = (raw, max) => {
    const numeric = Number(raw);
    if (!Number.isFinite(numeric) || raw === "") return { error: "Enter a score." };
    if (numeric < 0 || numeric > max) return { error: `Must be 0 – ${max}.` };
    return { value: numeric };
};

const GradeAssignment = () => {
    const { assignmentId } = useParams();
    const { push } = useToast();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const { data } = await gradingApi.assignmentSubmissions(assignmentId);
            setData(data);
        } catch (err) {
            setError(readError(err, "Could not load submissions."));
        } finally {
            setLoading(false);
        }
    }, [assignmentId]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) return <Spinner label="Loading submissions" />;
    if (error) return <ErrorState message={error} onRetry={load} />;
    if (!data) return null;

    const { assignment } = data;

    return (
        <>
            <Link
                to="/admin/grading"
                className="micro mb-6 inline-flex items-center gap-1 transition-colors hover:text-accent"
            >
                ← Back to grading
            </Link>

            <PageHeader
                eyebrow={`Max ${assignment.max_score} marks`}
                title={assignment.title}
                subtitle={
                    assignment.submission_type === "group"
                        ? "Grade the group as a whole, then override individual members if needed."
                        : "Enter a score and optional feedback for each student."
                }
                action={
                    assignment.onedrive_link && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                                window.open(
                                    assignment.onedrive_link,
                                    "_blank",
                                    "noopener,noreferrer"
                                )
                            }
                        >
                            Open submission folder
                        </Button>
                    )
                }
            />

            {assignment.submission_type === "group" ? (
                <GroupGrading
                    assignment={assignment}
                    groups={data.groups || []}
                    onSaved={load}
                    push={push}
                />
            ) : (
                <IndividualGrading
                    assignment={assignment}
                    students={data.students || []}
                    onSaved={load}
                    push={push}
                />
            )}
        </>
    );
};

/* ------------------------------ INDIVIDUAL ------------------------------ */

const IndividualGrading = ({ assignment, students, onSaved, push }) => {
    if (students.length === 0) {
        return (
            <EmptyState
                title="Nobody is assigned"
                description="Assign this assignment to students first."
            />
        );
    }

    const gradedCount = students.filter((s) => hasValue(s.score)).length;

    return (
        <section>
            <div className="mb-5 flex items-end justify-between border-b border-ink pb-3">
                <h2 className="text-2xl text-ink">Students</h2>
                <span className="micro">
                    {gradedCount} of {students.length} graded
                </span>
            </div>

            <Card className="overflow-hidden">
                <div className="micro hidden border-b border-ink bg-canvas px-5 py-3 sm:grid sm:grid-cols-[1fr_120px_1fr_auto] sm:gap-4">
                    <div>Student</div>
                    <div>Score</div>
                    <div>Feedback</div>
                    <div className="w-20" />
                </div>

                <div className="divide-y divide-line">
                    {students.map((s) => (
                        <IndividualRow
                            key={s.student_id}
                            assignment={assignment}
                            student={s}
                            onSaved={onSaved}
                            push={push}
                        />
                    ))}
                </div>
            </Card>
        </section>
    );
};

const IndividualRow = ({ assignment, student, onSaved, push }) => {
    const [score, setScore] = useState(
        hasValue(student.score) ? String(student.score) : ""
    );
    const [feedback, setFeedback] = useState(student.feedback ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const canGrade = Boolean(student.submission_id);
    const graded = hasValue(student.score);

    const save = async () => {
        setError("");
        const result = validateScore(score, assignment.max_score);
        if (result.error) {
            setError(result.error);
            return;
        }

        setSaving(true);
        try {
            await gradingApi.saveIndividual({
                submissionId: student.submission_id,
                score: result.value,
                feedback: feedback.trim()
            });
            push(`Graded ${student.student_name}`);
            onSaved();
        } catch (err) {
            setError(readError(err, "Could not save."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="px-5 py-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_120px_1fr_auto] sm:items-center sm:gap-4">
                <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line bg-surface text-[11px] font-bold text-ink-soft">
                        {initials(student.student_name)}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                            {student.student_name}
                        </p>
                        <p className="truncate text-[11px] text-ink-muted">
                            {student.student_email}
                        </p>
                    </div>
                    {graded && (
                        <Badge tone="success" className="ml-auto shrink-0 sm:hidden">
                            {student.score}/{assignment.max_score}
                        </Badge>
                    )}
                </div>

                <div>
                    {canGrade ? (
                        <input
                            type="number"
                            min="0"
                            max={assignment.max_score}
                            step="0.5"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                            placeholder="0"
                            className="field tnum h-9 w-full py-0"
                        />
                    ) : (
                        <Badge tone="neutral">Not submitted</Badge>
                    )}
                </div>

                <div>
                    {canGrade && (
                        <input
                            type="text"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Optional feedback"
                            className="field h-9 w-full py-0"
                        />
                    )}
                </div>

                <div className="flex w-full justify-end sm:w-20">
                    {canGrade && (
                        <Button
                            variant={graded ? "secondary" : "accent"}
                            size="sm"
                            onClick={save}
                            loading={saving}
                        >
                            {graded ? "Update" : "Save"}
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <p className="mt-2 font-mono text-[11px] text-danger">{error}</p>
            )}
        </div>
    );
};

/* -------------------------------- GROUP --------------------------------- */

const GroupGrading = ({ assignment, groups, onSaved, push }) => {
    if (groups.length === 0) {
        return (
            <EmptyState
                title="No groups received this assignment"
                description="Assign this group assignment to a group first."
            />
        );
    }

    return (
        <div className="space-y-6">
            {groups.map((g) => (
                <GroupGradeCard
                    key={g.group_id}
                    assignment={assignment}
                    group={g}
                    onSaved={onSaved}
                    push={push}
                />
            ))}
        </div>
    );
};

const GroupGradeCard = ({ assignment, group, onSaved, push }) => {
    const [commonScore, setCommonScore] = useState(
        hasValue(group.common_score) ? String(group.common_score) : ""
    );
    const [commonFeedback, setCommonFeedback] = useState(
        group.common_feedback ?? ""
    );
    const [savingCommon, setSavingCommon] = useState(false);
    const [error, setError] = useState("");

    const canGrade = Boolean(group.submission_id);
    const hasCommon = hasValue(group.common_score);
    const overrideCount = group.members.filter((m) =>
        hasValue(m.override_score)
    ).length;

    const saveCommon = async () => {
        setError("");
        const result = validateScore(commonScore, assignment.max_score);
        if (result.error) {
            setError(result.error);
            return;
        }

        setSavingCommon(true);
        try {
            await gradingApi.saveGroupCommon({
                groupId: group.group_id,
                submissionId: group.submission_id,
                score: result.value,
                feedback: commonFeedback.trim()
            });
            push("Group grade saved");
            onSaved();
        } catch (err) {
            setError(readError(err, "Could not save group grade."));
        } finally {
            setSavingCommon(false);
        }
    };

    return (
        <Card className="overflow-hidden border-l-4 border-l-ink">
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-6 py-5">
                <h3 className="mr-1 text-xl text-ink">{group.group_name}</h3>
                <Badge tone="neutral">{group.members.length} members</Badge>
                {!canGrade && <Badge tone="warn">Not submitted</Badge>}
                {hasCommon && <Badge tone="accent">Group graded</Badge>}
                {overrideCount > 0 && (
                    <Badge tone="warn">
                        {overrideCount} override{overrideCount > 1 ? "s" : ""}
                    </Badge>
                )}
            </div>

            <div className="border-b border-line bg-canvas/60 px-6 py-5">
                <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
                    <p className="micro text-ink">Common group grade</p>
                    <span className="text-[11px] text-ink-muted">
                        Applied to all members unless overridden
                    </span>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className="micro mb-1.5 block">
                            Score / {assignment.max_score}
                        </label>
                        <input
                            type="number"
                            min="0"
                            max={assignment.max_score}
                            step="0.5"
                            value={commonScore}
                            onChange={(e) => setCommonScore(e.target.value)}
                            disabled={!canGrade}
                            placeholder="0"
                            className="field tnum h-10 w-28 py-0"
                        />
                    </div>
                    <div className="min-w-60 flex-1">
                        <label className="micro mb-1.5 block">
                            Feedback (visible to all members)
                        </label>
                        <input
                            type="text"
                            value={commonFeedback}
                            onChange={(e) => setCommonFeedback(e.target.value)}
                            placeholder="Optional"
                            disabled={!canGrade}
                            className="field h-10 w-full py-0"
                        />
                    </div>
                    <Button
                        variant={hasCommon ? "secondary" : "accent"}
                        onClick={saveCommon}
                        loading={savingCommon}
                        disabled={!canGrade}
                    >
                        {hasCommon ? "Update group grade" : "Save group grade"}
                    </Button>
                </div>

                {error && (
                    <p className="mt-3 font-mono text-[11px] text-danger">{error}</p>
                )}
            </div>

            <div className="px-6 py-5">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <p className="micro text-ink">Members</p>
                    <p className="text-[11px] text-ink-muted">
                        Override a member to give them a different grade
                    </p>
                </div>

                <div className="space-y-2">
                    {group.members.map((m) => (
                        <MemberOverrideRow
                            key={m.id}
                            assignment={assignment}
                            group={group}
                            member={m}
                            onSaved={onSaved}
                            push={push}
                        />
                    ))}
                </div>
            </div>
        </Card>
    );
};

const MemberOverrideRow = ({ assignment, group, member, onSaved, push }) => {
    const hasOverride = hasValue(member.override_score);

    const [editing, setEditing] = useState(false);
    const [score, setScore] = useState(
        hasOverride ? String(member.override_score) : ""
    );
    const [feedback, setFeedback] = useState(member.override_feedback ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const canGrade = Boolean(group.submission_id);
    const effective = hasOverride ? member.override_score : group.common_score;

    const save = async () => {
        setError("");
        const result = validateScore(score, assignment.max_score);
        if (result.error) {
            setError(result.error);
            return;
        }

        setSaving(true);
        try {
            await gradingApi.saveGroupOverride({
                groupId: group.group_id,
                studentId: member.id,
                submissionId: group.submission_id,
                score: result.value,
                feedback: feedback.trim()
            });
            push("Override saved");
            setEditing(false);
            onSaved();
        } catch (err) {
            setError(readError(err, "Could not save override."));
        } finally {
            setSaving(false);
        }
    };

    const removeOverride = async () => {
        setSaving(true);
        try {
            await gradingApi.removeGroupOverride(group.submission_id, member.id);
            push("Override removed");
            onSaved();
        } catch (err) {
            setError(readError(err, "Could not remove override."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className={`rounded-md border px-3 py-3 ${
                hasOverride
                    ? "border-warn/40 bg-warn-soft/40"
                    : "border-line bg-surface"
            }`}
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line bg-canvas text-[11px] font-bold text-ink-soft">
                        {initials(member.name)}
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-ink">
                                {member.name}
                            </p>
                            {hasOverride && <Badge tone="warn">Override</Badge>}
                        </div>
                        <p className="truncate text-[11px] text-ink-muted">
                            {member.email}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="text-right">
                        <p className="micro text-[10px]">Effective</p>
                        <p className="tnum text-xl font-semibold text-ink">
                            {hasValue(effective) ? Number(effective) : "—"}
                            <span className="text-xs text-ink-faint">
                                {" "}
                                / {assignment.max_score}
                            </span>
                        </p>
                    </div>

                    {!editing && (
                        <div className="flex items-center gap-2">
                            {canGrade && (
                                <Button
                                    variant={hasOverride ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => {
                                        setEditing(true);
                                        setScore(
                                            hasOverride
                                                ? String(member.override_score)
                                                : ""
                                        );
                                        setFeedback(member.override_feedback ?? "");
                                        setError("");
                                    }}
                                >
                                    {hasOverride ? "Edit" : "+ Override"}
                                </Button>
                            )}
                            {hasOverride && (
                                <button
                                    type="button"
                                    onClick={removeOverride}
                                    disabled={saving}
                                    className="text-[11px] font-semibold text-ink-faint transition-colors hover:text-danger disabled:opacity-50"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {editing && (
                <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-line pt-3">
                    <div className="w-24">
                        <label className="micro mb-1.5 block text-[10px]">
                            Override score
                        </label>
                        <input
                            type="number"
                            min="0"
                            max={assignment.max_score}
                            step="0.5"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                            autoFocus
                            className="field tnum h-9 w-full py-0"
                        />
                    </div>
                    <div className="min-w-45 flex-1">
                        <label className="micro mb-1.5 block text-[10px]">
                            Reason / feedback
                        </label>
                        <input
                            type="text"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Optional"
                            className="field h-9 w-full py-0"
                        />
                    </div>
                    <Button
                        variant="accent"
                        size="sm"
                        onClick={save}
                        loading={saving}
                    >
                        Save
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setEditing(false);
                            setError("");
                        }}
                    >
                        Cancel
                    </Button>
                </div>
            )}

            {error && (
                <p className="mt-2 font-mono text-[11px] text-danger">{error}</p>
            )}
        </div>
    );
};

export default GradeAssignment;