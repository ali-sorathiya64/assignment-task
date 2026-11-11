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
import { dueLabel } from "../../api/format.js";
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

    const chartData = progress.slice(0, 10).map((p) => ({
        name: p.title.length > 10 ? `${p.title.slice(0, 9)}…` : p.title,
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

    const today = new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long"
    });

    return (
        <div className="space-y-12">
            <section className="surface-dark rounded-xl px-8 py-10 sm:px-12 sm:py-12">
                <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <p className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-canvas/50">
                            <span className="h-2 w-2 bg-accent" />
                            Professor · {today}
                        </p>
                       <div className="flex items-end gap-5">
    <p className="tnum flex items-start text-7xl font-semibold leading-none text-canvas sm:text-8xl">
        {overall}
        <span className="ml-1.5 mt-1 text-3xl font-medium leading-none tracking-normal text-canvas/50 sm:mt-2 sm:text-4xl">
            %
        </span>
    </p>
    <p className="max-w-40 pb-1 text-sm leading-snug text-canvas/55">
        of expected submissions confirmed
    </p>
</div>

<div className="mt-6 flex max-w-sm items-center gap-4">
    <div className="h-1 flex-1 bg-white/15">
        <div
            className="h-full bg-canvas transition-[width] duration-700 ease-out"
            style={{ width: `${overall}%` }}
        />
    </div>
    <span className="tnum shrink-0 text-xs text-canvas/50">
        {totalConfirmed} / {totalExpected}
    </span>
</div>

                        <div className="mt-8 flex flex-wrap gap-x-10 gap-y-5">
                            {[
                                { label: "Students", value: students.length },
                                { label: "Assignments", value: assignments.length },
                                { label: "Courses", value: courses.length },
                                { label: "Groups", value: groups.length }
                            ].map((stat) => (
                                <div key={stat.label}>
                                    <p className="tnum text-3xl font-semibold text-canvas">
                                        {stat.value}
                                    </p>
                                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-canvas/40">
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Link to="/admin/assignments" className="shrink-0">
                        <Button variant="accent" size="lg">
                            + New assignment
                        </Button>
                    </Link>
                </div>
            </section>

            <section>
                <div className="mb-5 flex items-end justify-between border-b border-ink pb-3">
                    <h2 className="text-2xl text-ink">Courses you teach</h2>
                    <span className="micro">
                        {courses.length}{" "}
                        {courses.length === 1 ? "course" : "courses"}
                    </span>
                </div>

                {courses.length === 0 ? (
                    <Card className="border-dashed px-6 py-14 text-center">
                        <p className="text-lg font-extrabold text-ink">
                            No courses yet
                        </p>
                        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
                            Create your first course to start enrolling
                            students.
                        </p>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {coursesWithStats.map((course) => (
                            <Link
                                key={course.id}
                                to={`/admin/assignments?course=${course.id}`}
                                className="group block"
                            >
                                <Card hover className="flex h-full flex-col px-6 py-6">
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="font-mono text-xs font-semibold text-accent">
                                            {course.code}
                                        </span>
                                        <span className="text-ink transition-transform duration-150 group-hover:translate-x-1 group-hover:text-accent">
                                            →
                                        </span>
                                    </div>

                                    <h3 className="mt-5 line-clamp-2 text-xl leading-snug text-ink">
                                        {course.name}
                                    </h3>

                                    <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-4">
                                        <div>
                                            <p className="micro">Students</p>
                                            <p className="tnum mt-1 text-2xl font-semibold text-ink">
                                                {course.student_count}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="micro">Assignments</p>
                                            <p className="tnum mt-1 text-2xl font-semibold text-ink">
                                                {course.assignment_count}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-5">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-ink-muted">
                                                {course.expected === 0
                                                    ? "No submissions"
                                                    : `${course.confirmed} / ${course.expected} confirmed`}
                                            </span>
                                            <span className="tnum font-semibold text-ink">
                                                {course.rate}%
                                            </span>
                                        </div>
                                        <div className="mt-2 h-1 w-full bg-line">
                                            <div
                                                className="h-full bg-accent"
                                                style={{ width: `${course.rate}%` }}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
                <section className="min-w-0">
                    <div className="mb-5 flex items-end justify-between border-b border-ink pb-3">
                        <h2 className="text-2xl text-ink">Completion rate</h2>
                        <span className="micro">Per assignment</span>
                    </div>

                    <Card className="px-5 py-6">
                        {chartData.length === 0 ? (
                            <p className="py-10 text-center text-sm text-ink-muted">
                                No assignments yet
                            </p>
                        ) : (
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} barCategoryGap={22}>
                                        <XAxis
                                            dataKey="name"
                                            tick={{
                                                fontSize: 10,
                                                fill: "#a29e93",
                                                fontFamily: "JetBrains Mono"
                                            }}
                                            tickLine={false}
                                            axisLine={{ stroke: "#121212" }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: "#ebe7db" }}
                                            contentStyle={{
                                                borderRadius: 6,
                                                border: "1px solid #121212",
                                                background: "#fffdf8",
                                                fontSize: 12,
                                                fontFamily: "JetBrains Mono",
                                                padding: "6px 10px"
                                            }}
                                            formatter={(value, _, props) => [
                                                `${props.payload.confirmed} of ${props.payload.total} confirmed`,
                                                "Progress"
                                            ]}
                                        />
                                        <Bar
                                            dataKey="value"
                                            fill="#2f4bff"
                                            maxBarSize={14}
                                            radius={[0, 0, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Card>
                </section>

                <aside>
                    <div className="mb-2 flex items-end justify-between border-b border-ink pb-3">
                        <h2 className="text-2xl text-ink">Due soon</h2>
                    </div>

                    {nearest.length === 0 ? (
                        <p className="py-8 text-center text-sm text-ink-muted">
                            Nothing pending
                        </p>
                    ) : (
                        <ul className="divide-y divide-line">
                            {nearest.map((item) => {
                                const due = dueLabel(item.due_date);
                                return (
                                    <li key={item.id}>
                                        <Link
                                            to={`/admin/assignments/${item.id}`}
                                            className="group block py-3.5"
                                        >
                                            <p className="truncate text-sm font-semibold text-ink group-hover:text-accent">
                                                {item.title}
                                            </p>
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <Badge tone={due.tone}>
                                                    {due.text}
                                                </Badge>
                                                <span className="tnum text-[11px] text-ink-faint">
                                                    {item.confirmed}/{item.total}
                                                </span>
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </aside>
            </div>

            <section>
                <div className="mb-2 flex items-end justify-between border-b border-ink pb-3">
                    <h2 className="text-2xl text-ink">Assignments</h2>
                    <Link
                        to="/admin/assignments"
                        className="text-xs font-semibold text-ink-muted transition-colors hover:text-accent"
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
                    <ul className="divide-y divide-line">
                        {progress.map((item) => {
                            const rate = item.total
                                ? Math.round((item.confirmed / item.total) * 100)
                                : 0;
                            const due = dueLabel(item.due_date);

                            return (
                                <li key={item.id}>
                                    <Link
                                        to={`/admin/assignments/${item.id}`}
                                        className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-surface"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="truncate text-[15px] font-semibold text-ink">
                                                    {item.title}
                                                </p>
                                                <Badge tone={due.tone}>
                                                    {due.text}
                                                </Badge>
                                                {item.submission_type === "group" && (
                                                    <Badge tone="neutral">
                                                        Group
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="micro mt-1.5">
                                                {item.confirmed} / {item.total}{" "}
                                                confirmed
                                            </p>
                                        </div>

                                        <div className="hidden w-36 shrink-0 items-center gap-3 sm:flex">
                                            <div className="h-1 flex-1 bg-line">
                                                <div
                                                    className="h-full bg-accent"
                                                    style={{ width: `${rate}%` }}
                                                />
                                            </div>
                                            <span className="tnum w-9 text-right text-xs font-semibold text-ink">
                                                {rate}%
                                            </span>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default AdminDashboard;