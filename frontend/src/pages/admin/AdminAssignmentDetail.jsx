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
    const [filter, setFilter] = useState("all");

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
        { name: "Confirmed", value: summary.submitted_students, fill: "#2f4bff" },
        { name: "Pending", value: summary.pending_students, fill: "#dcd7ca" }
    ];

    const counts = {
        all: students.length,
        confirmed: students.filter((s) => s.submitted).length,
        pending: students.filter((s) => !s.submitted).length
    };

    const visible = students.filter((student) => {
        if (filter === "confirmed") return student.submitted;
        if (filter === "pending") return !student.submitted;
        return true;
    });

    const filters = [
        { key: "all", label: "All" },
        { key: "confirmed", label: "Confirmed" },
        { key: "pending", label: "Pending" }
    ];

    return (
        <>
            <Link
                to="/admin/assignments"
                className="micro mb-6 inline-flex items-center gap-1 transition-colors hover:text-accent"
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

            <div className="mb-8 flex flex-wrap items-center gap-2">
                <Badge tone="neutral">
                    {assignment.submission_type === "group"
                        ? "Group submission"
                        : "Individual submission"}
                </Badge>
                <Badge tone={assignment.is_global ? "accent" : "neutral"}>
                    {assignment.is_global ? "Whole cohort" : "Targeted"}
                </Badge>
            </div>

            <Card className="mb-10 grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <Metric label="Assigned" value={summary.total_students} />
                <Metric
                    label="Confirmed"
                    value={summary.submitted_students}
                    tone="success"
                />
                <Metric
                    label="Pending"
                    value={summary.pending_students}
                    tone="warn"
                />
            </Card>

            <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
                <section className="min-w-0">
                    <div className="mb-5 flex items-end justify-between border-b border-ink pb-3">
                        <h2 className="text-2xl text-ink">Completion rate</h2>
                        <span className="micro">
                            {summary.submitted_students} / {summary.total_students}
                        </span>
                    </div>

                    <Card className="px-6 py-6">
                        <p className="tnum text-6xl font-semibold leading-none text-accent">
                            {rate}
                            <span className="text-2xl">%</span>
                        </p>

                        <div className="mt-6">
                            <Progress
                                value={rate}
                                tone={rate === 100 ? "success" : "accent"}
                            />
                        </div>

                        {assignment.description && (
                            <p className="mt-6 max-w-prose border-l-2 border-ink pl-4 text-sm leading-relaxed text-ink-soft">
                                {assignment.description}
                            </p>
                        )}
                    </Card>
                </section>

                <aside>
                    <div className="mb-5 flex items-end justify-between border-b border-ink pb-3">
                        <h2 className="text-2xl text-ink">Split</h2>
                    </div>

                    <Card className="px-4 py-5">
                        <div className="relative h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={54}
                                        outerRadius={76}
                                        paddingAngle={0}
                                        stroke="none"
                                    >
                                        {chartData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 6,
                                            border: "1px solid #121212",
                                            background: "#fffdf8",
                                            fontSize: 12,
                                            fontFamily: "JetBrains Mono",
                                            padding: "6px 10px"
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                <span className="tnum text-3xl font-semibold text-ink">
                                    {summary.submitted_students}
                                </span>
                                <span className="micro text-[10px]">confirmed</span>
                            </div>
                        </div>

                        <div className="mt-3 flex justify-center gap-5">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 bg-accent" />
                                <span className="micro">Confirmed</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 bg-line" />
                                <span className="micro">Pending</span>
                            </span>
                        </div>
                    </Card>
                </aside>
            </div>

            <section className="mt-12">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-ink pb-3">
                    <h2 className="text-2xl text-ink">Student status</h2>
                    <span className="micro">{students.length} total</span>
                </div>

                <div className="mb-6 flex gap-6 border-b border-line">
                    {filters.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => setFilter(item.key)}
                            className={`relative -mb-px pb-3 text-sm font-semibold transition-colors ${
                                filter === item.key
                                    ? "text-ink after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-accent"
                                    : "text-ink-muted hover:text-ink"
                            }`}
                        >
                            {item.label}
                            <span className="tnum ml-2 text-xs text-ink-faint">
                                {counts[item.key]}
                            </span>
                        </button>
                    ))}
                </div>

                {students.length === 0 ? (
                    <EmptyState
                        title="Nobody is assigned yet"
                        description='Use "Assign" on the assignments page to send this to a group or a student.'
                    />
                ) : visible.length === 0 ? (
                    <EmptyState
                        title={
                            filter === "confirmed"
                                ? "Nobody has confirmed yet"
                                : "Everyone has confirmed"
                        }
                        description={
                            filter === "confirmed"
                                ? "Once students acknowledge their submission, they'll appear here."
                                : "All assigned students have acknowledged this assignment."
                        }
                    />
                ) : (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-136 text-left text-sm">
                                <thead className="border-b border-ink bg-canvas">
                                    <tr>
                                        <th className="micro px-5 py-3 font-medium">Student</th>
                                        <th className="micro px-5 py-3 font-medium">Group</th>
                                        <th className="micro px-5 py-3 font-medium">Status</th>
                                        <th className="micro px-5 py-3 font-medium">
                                            Confirmed at
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.map((student) => (
                                        <tr
                                            key={`${student.student_id}-${student.group_id ?? "none"}`}
                                            className="border-b border-line last:border-0"
                                        >
                                            <td className="px-5 py-3">
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
                                            <td className="micro px-5 py-3 normal-case">
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
            </section>
        </>
    );
};

const Metric = ({ label, value, tone = "default" }) => {
    const valueClass =
        tone === "success"
            ? "text-success"
            : tone === "warn"
              ? "text-warn"
              : "text-ink";

    return (
        <div className="px-6 py-6">
            <p className="micro">{label}</p>
            <p
                className={`tnum mt-4 text-5xl font-semibold leading-none ${valueClass}`}
            >
                {value}
            </p>
        </div>
    );
};

export default AdminAssignmentDetail;