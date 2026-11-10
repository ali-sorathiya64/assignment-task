import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { gradingApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import { formatDate } from "../../api/format.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Card from "../../components/ui/Card.jsx";
import Progress from "../../components/ui/Progress.jsx";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States.jsx";

const AdminGrading = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const { data } = await gradingApi.dashboard();
            setRows(data.rows || []);
        } catch (err) {
            setError(readError(err, "Could not load grading dashboard."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) return <Spinner label="Loading grading dashboard" />;
    if (error) return <ErrorState message={error} onRetry={load} />;

    const totalPending = rows.reduce((sum, r) => {
        const graded =
            r.submission_type === "group"
                ? r.group_graded_count
                : r.individual_graded_count;
        return sum + Math.max(r.submitted_count - graded, 0);
    }, 0);

    const totalGraded = rows.reduce((sum, r) => {
        const graded =
            r.submission_type === "group"
                ? r.group_graded_count
                : r.individual_graded_count;
        return sum + graded;
    }, 0);

    // Group rows by course
    const byCourse = rows.reduce((acc, row) => {
        const key = row.course_id || "none";
        if (!acc[key]) {
            acc[key] = {
                course_id: row.course_id,
                course_name: row.course_name,
                course_code: row.course_code,
                assignments: []
            };
        }
        acc[key].assignments.push(row);
        return acc;
    }, {});

    return (
        <>
            <PageHeader
                eyebrow="Professor"
                title="Grading"
                subtitle="Review submitted work and record grades with feedback."
            />

            {/* Summary strip */}
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <SummaryTile
                    label="Assignments"
                    value={rows.length}
                    tone="default"
                />
                <SummaryTile
                    label="Pending grading"
                    value={totalPending}
                    tone={totalPending > 0 ? "warn" : "success"}
                />
                <SummaryTile
                    label="Graded"
                    value={totalGraded}
                    tone="success"
                />
            </div>

            {rows.length === 0 ? (
                <EmptyState
                    title="No gradeable assignments"
                    description="Attach assignments to a course to start grading."
                />
            ) : (
                <div className="space-y-8">
                    {Object.values(byCourse).map((course) => (
                        <section key={course.course_id || "none"}>
                            <div className="mb-3 flex items-center gap-3">
                                {course.course_code && (
                                    <span className="inline-flex items-center rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold tracking-tight text-accent">
                                        {course.course_code}
                                    </span>
                                )}
                                <h2 className="font-display text-base font-bold tracking-tight text-ink">
                                    {course.course_name || "Unassigned course"}
                                </h2>
                                <span className="text-xs text-ink-faint">
                                    {course.assignments.length}{" "}
                                    {course.assignments.length === 1
                                        ? "assignment"
                                        : "assignments"}
                                </span>
                            </div>

                            <div className="space-y-2">
                                {course.assignments.map((row) => (
                                    <GradingRow key={row.assignment_id} row={row} />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </>
    );
};

const SummaryTile = ({ label, value, tone }) => {
    const valueClass =
        tone === "warn"
            ? "text-warn"
            : tone === "success"
              ? "text-success"
              : "text-ink";

    return (
        <Card className="px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                {label}
            </p>
            <p
                className={`mt-2 font-display text-2xl font-bold tabular-nums ${valueClass}`}
            >
                {value}
            </p>
        </Card>
    );
};

const GradingRow = ({ row }) => {
    const graded =
        row.submission_type === "group"
            ? row.group_graded_count
            : row.individual_graded_count;
    const total = row.submitted_count;
    const pending = Math.max(total - graded, 0);
    const rate = total > 0 ? Math.round((graded / total) * 100) : 0;
    const allDone = total > 0 && pending === 0;

    return (
        <Card hover className="px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-[15px] font-bold tracking-tight text-ink">
                            {row.title}
                        </h3>
                        <Badge tone="neutral">
                            {row.submission_type === "group"
                                ? "Group"
                                : "Individual"}
                        </Badge>
                        {total === 0 ? (
                            <Badge tone="neutral">No submissions</Badge>
                        ) : allDone ? (
                            <Badge tone="success">✓ All graded</Badge>
                        ) : (
                            <Badge tone="warn">{pending} pending</Badge>
                        )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                        <span>Due {formatDate(row.due_date)}</span>
                        <span className="text-ink-faint">·</span>
                        <span>Max {row.max_score}</span>
                        <span className="text-ink-faint">·</span>
                        <span className="tabular-nums">
                            {graded}/{total} graded
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4 lg:w-64 lg:shrink-0">
                    <div className="hidden flex-1 sm:block">
                        <div className="mb-1 flex items-center justify-between text-[11px]">
                            <span className="text-ink-muted">Progress</span>
                            <span className="font-semibold tabular-nums text-ink">
                                {rate}%
                            </span>
                        </div>
                        <Progress
                            value={rate}
                            tone={allDone ? "success" : "accent"}
                        />
                    </div>

                    <Link to={`/admin/grading/${row.assignment_id}`}>
                        <button className="inline-flex h-9 items-center justify-center rounded-md bg-accent px-4 text-xs font-medium text-white shadow-xs transition-all hover:bg-accent-hover active:scale-[0.98]">
                            Grade →
                        </button>
                    </Link>
                </div>
            </div>
        </Card>
    );
};

export default AdminGrading;