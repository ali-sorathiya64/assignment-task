import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip
} from "recharts";
import { analyticsApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import { formatDate, initials } from "../../api/format.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Progress from "../../components/ui/Progress.jsx";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States.jsx";

const AdminAssignmentDetail = () => {
    const { assignmentId } = useParams();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await analyticsApi.assignment(assignmentId);
            setData(response.data);
        } catch (err) {
            setError(readError(err, "Could not load this assignment's progress."));
        } finally {
            setLoading(false);
        }
    }, [assignmentId]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) return <Spinner label="Loading progress" />;
    if (error) return <ErrorState message={error} onRetry={load} />;
    if (!data) return null;

    const { assignment, summary, students } = data;

    const rate = summary.total_students
        ? Math.round((summary.submitted_students / summary.total_students) * 100)
        : 0;

    const chartData = [
        { name: "Confirmed", value: summary.submitted_students, fill: "#6d28d9" },
        { name: "Pending", value: summary.pending_students, fill: "#e7e5e4" }
    ];

    return (
        <>
            <Link
                to="/admin/assignments"
                className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
            >
                ← Back to assignments
            </Link>

            <PageHeader
                eyebrow={assignment.is_global ? "Whole cohort" : "Targeted"}
                title={assignment.title}
                subtitle={`Due ${formatDate(assignment.due_date)}`}
                action={
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
                        Open folder
                    </Button>
                }
            />

            <div className="grid gap-4 lg:grid-cols-3">
                <MetricMini label="Assigned" value={summary.total_students} />
                <MetricMini
                    label="Confirmed"
                    value={summary.submitted_students}
                    tone="success"
                />
                <MetricMini
                    label="Pending"
                    value={summary.pending_students}
                    tone="warn"
                />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                <Card className="px-6 py-6">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                                Completion rate
                            </p>
                            <p className="mt-3 font-sans text-4xl font-semibold tabular-nums tracking-tight text-ink">
                                {rate}%
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Progress
                            value={rate}
                            tone={rate === 100 ? "success" : "accent"}
                        />
                    </div>

                    {assignment.description && (
                        <p className="mt-6 max-w-prose text-sm leading-relaxed text-ink-soft">
                            {assignment.description}
                        </p>
                    )}
                </Card>

                <Card className="px-4 py-5">
                    <h2 className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-ink-muted">
                        Submission split
                    </h2>

                    <div className="relative h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={52}
                                    outerRadius={76}
                                    paddingAngle={2}
                                    stroke="none"
                                >
                                    {chartData.map((entry) => (
                                        <Cell key={entry.name} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: 8,
                                        border: "1px solid #E7E5E4",
                                        fontSize: 12
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="font-sans text-2xl font-semibold tabular-nums text-ink">
                                {summary.submitted_students}
                            </span>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                                confirmed
                            </span>
                        </div>
                    </div>

                    <div className="mt-3 flex justify-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-accent" />
                            <span className="text-ink-muted">Confirmed</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-line" />
                            <span className="text-ink-muted">Pending</span>
                        </span>
                    </div>
                </Card>
            </div>

            <h2 className="mb-3 mt-8 font-display text-base font-bold tracking-tight text-ink">
                Student status
            </h2>

            {students.length === 0 ? (
                <EmptyState
                    title="Nobody is assigned yet"
                    description='Use "Assign" on the assignments page to send this to a group or a student.'
                />
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-136 text-left text-sm">
                            <thead className="border-b border-line bg-canvas text-xs text-ink-muted">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Student</th>
                                    <th className="px-5 py-3 font-medium">Group</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium">
                                        Confirmed at
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => (
                                    <tr
                                        key={`${student.student_id}-${student.group_id ?? "none"}`}
                                        className="border-b border-line last:border-0"
                                    >
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-canvas text-xs font-semibold text-ink-soft">
                                                    {initials(student.student_name)}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-ink">
                                                        {student.student_name}
                                                    </p>
                                                    <p className="text-xs text-ink-muted">
                                                        {student.student_email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-ink-soft">
                                            {student.group_name || "—"}
                                        </td>
                                        <td className="px-5 py-3">
                                            <Badge
                                                tone={
                                                    student.submitted
                                                        ? "success"
                                                        : "warn"
                                                }
                                            >
                                                {student.submitted
                                                    ? "Confirmed"
                                                    : "Pending"}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-3 text-xs text-ink-muted">
                                            {student.confirmed_at
                                                ? formatDate(student.confirmed_at)
                                                : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </>
    );
};

const MetricMini = ({ label, value, tone = "default" }) => {
    const valueClass =
        tone === "success"
            ? "text-success"
            : tone === "warn"
              ? "text-warn"
              : "text-ink";

    return (
        <Card className="px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                {label}
            </p>
            <p
                className={`mt-2 font-sans text-2xl font-semibold tabular-nums ${valueClass}`}
            >
                {value}
            </p>
        </Card>
    );
};

export default AdminAssignmentDetail;