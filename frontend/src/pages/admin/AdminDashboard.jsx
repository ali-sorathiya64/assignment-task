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
import { dueLabel, formatDate, initials } from "../../api/format.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States.jsx";

const COURSE_ACCENTS = [
    "bg-violet-500",
    "bg-sky-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-indigo-500"
];

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
        name:
            p.title.length > 12 ? `${p.title.slice(0, 11)}…` : p.title,
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
        const courseConfirmed = courseProgress.reduce(
            (s, p) => s + p.confirmed,
            0
        );
        const courseExpected = courseProgress.reduce(
            (s, p) => s + p.total,
            0
        );
        const rate = courseExpected
            ? Math.round((courseConfirmed / courseExpected) * 100)
            : 0;

        return { ...course, confirmed: courseConfirmed, expected: courseExpected, rate };
    });

    return (
        <>
            <PageHeader
                eyebrow="Professor"
                title="Cohort overview"
                subtitle="A live read on courses, assignments, groups, and confirmations."
                action={
                    <Link to="/admin/assignments">
                        <Button variant="accent" size="sm">
                            + New assignment
                        </Button>
                    </Link>
                }
            />

            <div className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-line pb-5">
                <InlineStat label="Courses" value={courses.length} />
                <InlineStat label="Assignments" value={assignments.length} />
                <InlineStat label="Groups" value={groups.length} />
                <InlineStat label="Students" value={students.length} />
                <InlineStat
                    label="Confirmations"
                    value={`${totalConfirmed} / ${totalExpected}`}
                    highlight
                />
            </div>

            {/* ====== Courses taught ====== */}
            <section className="mb-8">
                <div className="mb-3 flex items-end justify-between">
                    <div>
                        <h2 className="font-display text-base font-bold tracking-tight text-ink">
                            Courses you teach
                        </h2>
                        <p className="mt-0.5 text-xs text-ink-muted">
                            A live snapshot of enrollment and submission progress
                        </p>
                    </div>
                </div>

                {courses.length === 0 ? (
                    <EmptyState
                        title="No courses yet"
                        description="Once you create a course, it will appear here with student and submission stats."
                    />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {coursesWithStats.map((course, i) => {
                            const accent =
                                COURSE_ACCENTS[i % COURSE_ACCENTS.length];

                            return (
                                <Link
                                    key={course.id}
                                    to={`/admin/assignments?course=${course.id}`}
                                    className="group block"
                                >
                                    <Card
                                        hover
                                        className="relative flex h-full flex-col overflow-hidden px-5 py-5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md"
                                    >
                                        <span
                                            className={`absolute inset-x-0 top-0 h-1 ${accent}`}
                                        />

                                        <div className="flex items-start justify-between gap-3">
                                            <Badge tone="accent">
                                                {course.code}
                                            </Badge>
                                            <svg
                                                className="h-4 w-4 text-ink-faint transition-transform duration-200 group-hover:translate-x-1 group-hover:text-ink"
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

                                        <h3 className="mt-3 font-display text-base font-bold leading-snug tracking-tight text-ink">
                                            {course.name}
                                        </h3>

                                        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line-soft pt-3">
                                            <div>
                                                <p className="text-[10px] font-medium uppercase tracking-wider text-ink-faint">
                                                    Students
                                                </p>
                                                <p className="mt-0.5 font-sans text-lg font-semibold tabular-nums text-ink">
                                                    {course.student_count}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-medium uppercase tracking-wider text-ink-faint">
                                                    Assignments
                                                </p>
                                                <p className="mt-0.5 font-sans text-lg font-semibold tabular-nums text-ink">
                                                    {course.assignment_count}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-4">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="font-medium text-ink-muted">
                                                    {course.expected === 0
                                                        ? "No submissions yet"
                                                        : `${course.confirmed} / ${course.expected} confirmed`}
                                                </span>
                                                <span
                                                    className={`font-semibold tabular-nums ${
                                                        course.rate === 100
                                                            ? "text-success"
                                                            : "text-ink"
                                                    }`}
                                                >
                                                    {course.rate}%
                                                </span>
                                            </div>
                                            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line-soft">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        course.rate === 100
                                                            ? "bg-success"
                                                            : "bg-ink"
                                                    }`}
                                                    style={{
                                                        width: `${course.rate}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ====== Rest of dashboard (unchanged layout) ====== */}
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    <Card className="px-5 py-5">
                        <div className="mb-4 flex items-end justify-between">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                                    Completion rate
                                </p>
                                <p className="mt-1 font-sans text-3xl font-semibold tabular-nums tracking-tight text-ink">
                                    {overall}%
                                </p>
                            </div>
                            <p className="text-xs text-ink-faint">
                                {totalConfirmed} of {totalExpected} confirmed
                            </p>
                        </div>

                        {chartData.length === 0 ? (
                            <p className="py-10 text-center text-sm text-ink-muted">
                                No assignments yet
                            </p>
                        ) : (
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} barCategoryGap={14}>
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 10, fill: "#a1a1aa" }}
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
                                            fill="#18181b"
                                            radius={[3, 3, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Card>

                    <div>
                        <div className="mb-3 flex items-end justify-between">
                            <h2 className="font-display text-base font-bold tracking-tight text-ink">
                                Assignments
                            </h2>
                            <Link
                                to="/admin/assignments"
                                className="text-xs font-medium text-ink-muted hover:text-ink"
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
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate font-medium text-ink">
                                                        {item.title}
                                                    </p>
                                                    <Badge tone={due.tone}>
                                                        {due.text}
                                                    </Badge>
                                                </div>
                                                <p className="mt-0.5 text-xs text-ink-muted">
                                                    {item.confirmed} / {item.total} confirmed
                                                </p>
                                            </div>

                                            <div className="hidden w-32 shrink-0 items-center gap-2 sm:flex">
                                                <div className="h-1 flex-1 overflow-hidden rounded-full bg-line-soft">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            rate === 100
                                                                ? "bg-success"
                                                                : "bg-ink"
                                                        }`}
                                                        style={{ width: `${rate}%` }}
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
                    </div>
                </div>

                <div className="space-y-4">
                    <Card className="px-5 py-5">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                                Due soon
                            </p>
                            <span className="h-1.5 w-1.5 rounded-full bg-warn" />
                        </div>

                        {nearest.length === 0 ? (
                            <p className="py-4 text-center text-xs text-ink-faint">
                                Nothing pending
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {nearest.map((item) => {
                                    const due = dueLabel(item.due_date);
                                    return (
                                        <li key={item.id}>
                                            <Link
                                                to={`/admin/assignments/${item.id}`}
                                                className="block group"
                                            >
                                                <p className="truncate text-sm font-medium text-ink group-hover:text-accent">
                                                    {item.title}
                                                </p>
                                                <p className="mt-0.5 text-xs text-ink-muted">
                                                    {formatDate(item.due_date)}
                                                </p>
                                                <div className="mt-1.5">
                                                    <Badge tone={due.tone}>
                                                        {due.text}
                                                    </Badge>
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Card>

                    <Card className="px-5 py-5">
                        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-ink-muted">
                            Snapshot
                        </p>

                        <dl className="space-y-3.5">
                            <SnapshotRow
                                label="Avg. group size"
                                value={
                                    groups.length
                                        ? (
                                              students.length / groups.length
                                          ).toFixed(1)
                                        : "—"
                                }
                            />
                            <SnapshotRow
                                label="Ungrouped students"
                                value={Math.max(
                                    students.length -
                                        groups.reduce(
                                            (s, g) => s + (g.members?.length || 0),
                                            0
                                        ),
                                    0
                                )}
                            />
                            <SnapshotRow
                                label="Total confirmations"
                                value={totalConfirmed}
                            />
                        </dl>
                    </Card>

                    <Card className="border-ink bg-ink px-5 py-5">
                        <p className="font-display text-sm font-bold tracking-tight text-white">
                            Need to reach the whole cohort?
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-white/60">
                            Post a global assignment — every student sees it
                            instantly.
                        </p>
                        <Link to="/admin/assignments" className="mt-4 block">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full border-white/20 bg-white/5 text-white hover:border-white hover:bg-white/10"
                            >
                                Post assignment
                            </Button>
                        </Link>
                    </Card>
                </div>
            </div>
        </>
    );
};

const InlineStat = ({ label, value, highlight = false }) => (
    <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            {label}
        </p>
        <p
            className={`mt-0.5 font-sans text-lg font-semibold tabular-nums tracking-tight ${
                highlight ? "text-accent" : "text-ink"
            }`}
        >
            {value}
        </p>
    </div>
);

const SnapshotRow = ({ label, value }) => (
    <div className="flex items-center justify-between">
        <dt className="text-xs text-ink-muted">{label}</dt>
        <dd className="font-sans text-sm font-semibold tabular-nums text-ink">
            {value}
        </dd>
    </div>
);

export default AdminDashboard;