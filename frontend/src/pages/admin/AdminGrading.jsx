import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { gradingApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import { formatDate } from "../../api/format.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Progress from "../../components/ui/Progress.jsx";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States.jsx";

const gradedOf = (r) =>
    r.submission_type === "group"
        ? r.group_graded_count
        : r.individual_graded_count;

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

    const totalPending = rows.reduce(
        (sum, r) => sum + Math.max(r.submitted_count - gradedOf(r), 0),
        0
    );
    const totalGraded = rows.reduce((sum, r) => sum + gradedOf(r), 0);

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

            <Card className="mb-12 grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="px-6 py-6">
                    <p className="micro">Assignments</p>
                    <p className="tnum mt-4 text-5xl font-semibold leading-none text-ink">
                        {rows.length}
                    </p>
                </div>
                <div className="px-6 py-6">
                    <p className="micro">Pending grading</p>
                    <p
                        className={`tnum mt-4 text-5xl font-semibold leading-none ${
                            totalPending > 0 ? "text-warn" : "text-success"
                        }`}
                    >
                        {totalPending}
                    </p>
                </div>
                <div className="px-6 py-6">
                    <p className="micro">Graded</p>
                    <p className="tnum mt-4 text-5xl font-semibold leading-none text-accent">
                        {totalGraded}
                    </p>
                </div>
            </Card>

            {rows.length === 0 ? (
                <EmptyState
                    title="No gradeable assignments"
                    description="Attach assignments to a course to start grading."
                />
            ) : (
                <div className="space-y-12">
                    {Object.values(byCourse).map((course) => (
                        <section key={course.course_id || "none"}>
                            <div className="mb-5 flex items-end justify-between gap-4 border-b border-ink pb-3">
                                <div className="flex min-w-0 items-baseline gap-3">
                                    {course.course_code && (
                                        <span className="font-mono text-xs font-semibold text-accent">
                                            {course.course_code}
                                        </span>
                                    )}
                                    <h2 className="truncate text-2xl text-ink">
                                        {course.course_name || "Unassigned course"}
                                    </h2>
                                </div>
                                <span className="micro shrink-0">
                                    {course.assignments.length}{" "}
                                    {course.assignments.length === 1
                                        ? "assignment"
                                        : "assignments"}
                                </span>
                            </div>

                            <div className="space-y-4">
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

const GradingRow = ({ row }) => {
    const graded = gradedOf(row);
    const total = row.submitted_count;
    const pending = Math.max(total - graded, 0);
    const rate = total > 0 ? Math.round((graded / total) * 100) : 0;
    const allDone = total > 0 && pending === 0;
    const isGroup = row.submission_type === "group";

    return (
        <Card
            hover
            className={`flex flex-col gap-6 border-l-4 px-6 py-6 lg:flex-row lg:items-center ${
                isGroup ? "border-l-ink" : "border-l-accent"
            }`}
        >
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">{isGroup ? "Group" : "Individual"}</Badge>
                    {total === 0 ? (
                        <Badge tone="neutral">No submissions</Badge>
                    ) : allDone ? (
                        <Badge tone="success">✓ All graded</Badge>
                    ) : (
                        <Badge tone="warn">{pending} pending</Badge>
                    )}
                </div>

                <h3 className="mt-3 text-xl font-extrabold tracking-tight text-ink">
                    {row.title}
                </h3>

                <p className="micro mt-3 normal-case">
                    Due {formatDate(row.due_date)} · Max {row.max_score}
                </p>
            </div>

            <div className="flex items-center gap-5 lg:w-80 lg:shrink-0">
                <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="micro">
                            {graded}/{total} graded
                        </span>
                        <span className="tnum text-xs font-semibold text-ink">
                            {rate}%
                        </span>
                    </div>
                    <Progress value={rate} tone={allDone ? "success" : "accent"} />
                </div>

                <Link to={`/admin/grading/${row.assignment_id}`}>
                    <Button variant="accent" size="sm">
                        Grade →
                    </Button>
                </Link>
            </div>
        </Card>
    );
};

export default AdminGrading;