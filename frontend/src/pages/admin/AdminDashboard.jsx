import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis
} from "recharts";
import {
    analyticsApi,
    assignmentApi,
    courseApi,
    groupApi,
    userApi
} from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import { dueLabel, formatDate } from "../../api/format.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States.jsx";

const AdminDashboard = () => {
    const [state, setState] = useState({
        assignments: [],
        groups: [],
        students: [],
        courses: [],
        progress: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [assignmentRes, groupRes, studentRes, courseRes] =
                await Promise.all([
                    assignmentApi.list(),
                    groupApi.allGroups(),
                    userApi.students(),
                    courseApi.myTaught()
                ]);

            const assignments = assignmentRes.data.assignments || [];
            const courses = courseRes.data.courses || [];

            const progress = await Promise.all(
                assignments.map((assignment) =>
                    analyticsApi
                        .assignment(assignment.id)
                        .then(({ data }) => ({
                            id: assignment.id,
                            title: assignment.title,
                            due_date: assignment.due_date,
                            course_id: assignment.course_id,
                            submission_type: assignment.submission_type,
                            confirmed: data.summary.submitted_students,
                            pending: data.summary.pending_students,
                            total: data.summary.total_students
                        }))
                        .catch(() => null)
                )
            );

            setState({
                assignments,
                groups: groupRes.data.groups || [],
                students: studentRes.data.students || [],
                courses,
                progress: progress.filter(Boolean)
            });
        } catch (err) {
            setError(readError(err, "Could not load the dashboard."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) return <Spinner label="Loading" />;
    if (error) return <ErrorState message={error} onRetry={load} />;

    const { assignments, groups, students, courses, progress } = state;

    const totalConfirmed = progress.reduce((s, p) => s + p.confirmed, 0);
    const totalExpected = progress.reduce((s, p) => s + p.total, 0);
    const overall = totalExpected
        ? Math.round((totalConfirmed / totalExpected) * 100)
        : 0;

    const chartData = progress.slice(0, 8).map((p) => ({
        name: p.title.length > 12 ? `${p.title.slice(0, 11)}…` : p.title,
        value: p.total ? Math.round((p.confirmed / p.total) * 100) : 0,
        confirmed: p.confirmed,
        total: p.total
    }));

    const nearest = [...progress]
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 4);

    const coursesWithStats = courses.map((course) => {
        const courseProgress = progress.filter(
            (p) => p.course_id === course.id
        );
        const confirmed = courseProgress.reduce((s, p) => s + p.confirmed, 0);
        const expected = courseProgress.reduce((s, p) => s + p.total, 0);
        const rate = expected ? Math.round((confirmed / expected) * 100) : 0;

        return { ...course, confirmed, expected, rate };
    });

    return (
        <>
            <PageHeader
                eyebrow="Professor"
                title="Cohort overview"
                subtitle="Courses, assignments, and confirmations at a glance."
                action={
                    <Link to="/admin/assignments">
                        <Button variant="accent" size="sm">
                            + New assignment
                        </Button>
                    </Link>
                }
            />

            <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:items-start">
                {/* ================= LEFT: sticky side ================= */}
                <aside className="space-y-4 lg:sticky lg:top-6">
                    {/* Overall ring */}
                    <Card className="px-5 py-6">
                        <div className="flex items-center justify-center">
                            <div className="relative grid h-32 w-32 place-items-center">
                                <svg
                                    className="h-32 w-32 -rotate-90"
                                    viewBox="0 0 100 100"
                                >
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="42"
                                        fill="none"
                                        stroke="var(--color-line-soft)"
                                        strokeWidth="7"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="42"
                                        fill="none"
                                        stroke="var(--color-accent)"
                                        strokeWidth="7"
                                        strokeLinecap="round"
                                        strokeDasharray={`${(overall / 100) * 264} 264`}
                                        style={{
                                            transition:
                                                "stroke-dasharray 700ms ease-out"
                                        }}
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="font-display text-2xl font-bold tabular-nums leading-none text-ink">
                                        {overall}%
                                    </span>
                                    <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                                        confirmed
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p className="mt-5 text-center text-sm text-ink-muted">
                            <span className="font-semibold text-ink">
                                {totalConfirmed}
                            </span>{" "}
                            of {totalExpected} submissions
                        </p>
                    </Card>

                    {/* Stat stack */}
                    <Card className="divide-y divide-line">
                        <StatRow label="Courses" value={courses.length} />
                        <StatRow label="Assignments" value={assignments.length} />
                        <StatRow label="Groups" value={groups.length} />
                        <StatRow label="Students" value={students.length} />
                    </Card>

                    {/* Due soon */}
                    <Card className="px-5 py-5">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                                Due soon
                            </p>
                            <span className="h-1.5 w-1.5 rounded-full bg-warn" />
                        </div>

                        {nearest.length === 0 ? (
                            <p className="py-3 text-center text-xs text-ink-faint">
                                Nothing pending
                            </p>
                        ) : (
                            <ul className="space-y-2.5">
                                {nearest.map((item) => {
                                    const due = dueLabel(item.due_date);
                                    return (
                                        <li key={item.id}>
                                            <Link
                                                to={`/admin/assignments/${item.id}`}
                                                className="group block rounded-md px-2.5 py-2 transition-colors hover:bg-canvas"
                                            >
                                                <p className="truncate text-sm font-medium text-ink group-hover:text-accent">
                                                    {item.title}
                                                </p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <Badge tone={due.tone}>
                                                        {due.text}
                                                    </Badge>
                                                    <span className="text-[11px] text-ink-faint">
                                                        {item.confirmed}/
                                                        {item.total}
                                                    </span>
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Card>

                    {/* CTA */}
                    <Card className="border-ink bg-ink px-5 py-5">
                        <p className="font-display text-sm font-bold tracking-tight text-white">
                            Reach the whole cohort
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-white/60">
                            Post a global assignment — every student sees it
                            instantly.
                        </p>
                        <Link to="/admin/assignments" className="mt-3 block">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full border-white/20 bg-white/5 text-white hover:border-white hover:bg-white/10"
                            >
                                Post assignment
                            </Button>
                        </Link>
                    </Card>
                </aside>

                {/* ================= RIGHT: main ================= */}
                <div className="min-w-0 space-y-8">
                    {/* Courses you teach */}
                    <section>
                        <div className="mb-4 flex items-end justify-between">
                            <div>
                                <h2 className="font-display text-lg font-bold tracking-tight text-ink">
                                    Courses you teach
                                </h2>
                                <p className="mt-0.5 text-xs text-ink-muted">
                                    Click a course to see its assignments
                                </p>
                            </div>
                            {courses.length > 0 && (
                                <span className="text-xs font-medium text-ink-faint tabular-nums">
                                    {courses.length}{" "}
                                    {courses.length === 1 ? "course" : "courses"}
                                </span>
                            )}
                        </div>

                        {courses.length === 0 ? (
                            <Card className="px-6 py-14 text-center">
                                <p className="font-display text-base font-bold text-ink">
                                    No courses yet
                                </p>
                                <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
                                    Create your first course to start enrolling
                                    students.
                                </p>
                            </Card>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {coursesWithStats.map((course) => (
                                    <Link
                                        key={course.id}
                                        to={`/admin/assignments?course=${course.id}`}
                                        className="group block"
                                    >
                                        <Card
                                            hover
                                            className="flex h-full flex-col px-5 py-5 transition-all duration-200 group-hover:border-accent/40"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <span className="inline-flex items-center rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold tracking-tight text-accent">
                                                    {course.code}
                                                </span>
                                                <svg
                                                    className="h-3.5 w-3.5 text-ink-faint transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <line
                                                        x1="5"
                                                        y1="12"
                                                        x2="19"
                                                        y2="12"
                                                    />
                                                    <polyline points="12 5 19 12 12 19" />
                                                </svg>
                                            </div>

                                            <h3 className="mt-4 font-display text-base font-bold leading-snug tracking-tight text-ink line-clamp-2">
                                                {course.name}
                                            </h3>

                                            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line-soft pt-3">
                                                <div>
                                                    <p className="text-[10px] font-medium uppercase tracking-wider text-ink-faint">
                                                        Students
                                                    </p>
                                                    <p className="mt-0.5 font-display text-base font-bold tabular-nums text-ink">
                                                        {course.student_count}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-medium uppercase tracking-wider text-ink-faint">
                                                        Assignments
                                                    </p>
                                                    <p className="mt-0.5 font-display text-base font-bold tabular-nums text-ink">
                                                        {course.assignment_count}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-auto pt-4">
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-ink-muted">
                                                        {course.expected === 0
                                                            ? "No submissions"
                                                            : `${course.confirmed} / ${course.expected} confirmed`}
                                                    </span>
                                                    <span className="font-semibold tabular-nums text-ink">
                                                        {course.rate}%
                                                    </span>
                                                </div>
                                                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-line-soft">
                                                    <div
                                                        className="h-full rounded-full bg-accent"
                                                        style={{
                                                            width: `${course.rate}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Completion chart */}
                    <section>
                        <div className="mb-4">
                            <h2 className="font-display text-lg font-bold tracking-tight text-ink">
                                Completion rate
                            </h2>
                            <p className="mt-0.5 text-xs text-ink-muted">
                                Per-assignment progress
                            </p>
                        </div>

                        <Card className="px-5 py-5">
                            {chartData.length === 0 ? (
                                <p className="py-10 text-center text-sm text-ink-muted">
                                    No assignments yet
                                </p>
                            ) : (
                                <div className="h-48">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={chartData}
                                            barCategoryGap={16}
                                        >
                                            <XAxis
                                                dataKey="name"
                                                tick={{
                                                    fontSize: 10,
                                                    fill: "#a1a1aa"
                                                }}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip
                                                cursor={{ fill: "#f4f4f5" }}
                                                contentStyle={{
                                                    borderRadius: 8,
                                                    border: "1px solid #E7E5E4",
                                                    fontSize: 12,
                                                    padding: "6px 10px"
                                                }}
                                                formatter={(value, _, props) => [
                                                    `${props.payload.confirmed} of ${props.payload.total} confirmed`,
                                                    "Progress"
                                                ]}
                                            />
                                            <Bar
                                                dataKey="value"
                                                fill="#6d28d9"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </Card>
                    </section>

                    {/* Assignments list */}
                    <section>
                        <div className="mb-4 flex items-end justify-between">
                            <div>
                                <h2 className="font-display text-lg font-bold tracking-tight text-ink">
                                    Assignments
                                </h2>
                                <p className="mt-0.5 text-xs text-ink-muted">
                                    All posted assignments with progress
                                </p>
                            </div>
                            <Link
                                to="/admin/assignments"
                                className="text-xs font-medium text-ink-muted transition-colors hover:text-ink"
                            >
                                Manage →
                            </Link>
                        </div>

                        {progress.length === 0 ? (
                            <EmptyState
                                title="Nothing posted yet"
                                description="Create your first assignment to start tracking."
                            />
                        ) : (
                            <Card className="divide-y divide-line">
                                {progress.map((item) => {
                                    const rate = item.total
                                        ? Math.round(
                                              (item.confirmed / item.total) * 100
                                          )
                                        : 0;
                                    const due = dueLabel(item.due_date);

                                    return (
                                        <Link
                                            key={item.id}
                                            to={`/admin/assignments/${item.id}`}
                                            className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-canvas"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="truncate font-medium text-ink">
                                                        {item.title}
                                                    </p>
                                                    <Badge tone={due.tone}>
                                                        {due.text}
                                                    </Badge>
                                                    {item.submission_type ===
                                                        "group" && (
                                                        <Badge tone="neutral">
                                                            Group
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 text-xs text-ink-muted">
                                                    {item.confirmed} /{" "}
                                                    {item.total} confirmed
                                                </p>
                                            </div>

                                            <div className="hidden w-32 shrink-0 items-center gap-2 sm:flex">
                                                <div className="h-1 flex-1 overflow-hidden rounded-full bg-line-soft">
                                                    <div
                                                        className="h-full rounded-full bg-accent"
                                                        style={{
                                                            width: `${rate}%`
                                                        }}
                                                    />
                                                </div>
                                                <span className="w-9 text-right text-xs font-medium tabular-nums text-ink-muted">
                                                    {rate}%
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </Card>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
};

const StatRow = ({ label, value }) => (
    <div className="flex items-center justify-between px-5 py-3.5">
        <span className="text-xs font-medium text-ink-muted">{label}</span>
        <span className="font-display text-base font-bold tabular-nums text-ink">
            {value}
        </span>
    </div>
);

export default AdminDashboard;