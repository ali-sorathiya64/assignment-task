import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useStudentAssignments } from "../../hooks/useStudentAssignments.js";
import { courseApi, groupApi } from "../../api/endpoints.js";
import { dueLabel, formatDate, initials } from "../../api/format.js";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { ErrorState, Spinner } from "../../components/ui/States.jsx";
import ConfirmSubmissionModal from "./ConfirmSubmissionModal.jsx";
import AskAIModal from "./AskAIModal.jsx";

const StudentDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const {
        assignments,
        loading,
        error,
        reload,
        markSubmitted,
        submittedCount,
        pendingCount
    } = useStudentAssignments();

    const [groups, setGroups] = useState([]);
    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [active, setActive] = useState(null);
    const [asking, setAsking] = useState(null);

    useEffect(() => {
        groupApi
            .myGroups()
            .then(({ data }) => setGroups(data.groups || []))
            .catch(() => setGroups([]));
    }, []);

    useEffect(() => {
        setCoursesLoading(true);

        courseApi
            .myEnrolled()
            .then(({ data }) => setCourses(data.courses || []))
            .catch(() => setCourses([]))
            .finally(() => setCoursesLoading(false));
    }, []);

    const total = assignments.length;
    const completion = total ? Math.round((submittedCount / total) * 100) : 0;
    const firstName = user?.name?.split(" ")[0] || "there";

    const upcoming = assignments
        .filter((a) => !a.submitted)
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 6);

    const today = new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long"
    });

    return (
        <>
            {loading && <Spinner label="Loading" />}
            {!loading && error && <ErrorState message={error} onRetry={reload} />}

            {!loading && !error && (
                <div className="space-y-12">
                    <section className="surface-dark rounded-xl px-8 py-10 sm:px-12 sm:py-12">
                        <div className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                                <p className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-canvas/50">
                                    <span className="h-2 w-2 bg-accent" />
                                    {today}
                                </p>
                                <h1 className="text-5xl leading-[0.95] text-canvas sm:text-7xl">
                                    Hey, {firstName}.
                                </h1>
                                <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-canvas/55">
                                    {pendingCount === 0
                                        ? "You're all caught up. Nothing pending right now."
                                        : `${pendingCount} assignment${
                                              pendingCount === 1 ? "" : "s"
                                          } still waiting for your confirmation.`}
                                </p>

                                <div className="mt-9 flex flex-wrap gap-x-10 gap-y-5">
                                    {[
                                        { label: "Pending", value: pendingCount },
                                        { label: "Confirmed", value: submittedCount },
                                        { label: "Groups", value: groups.length },
                                        { label: "Courses", value: courses.length }
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

                            <div className="relative mx-auto grid h-44 w-44 shrink-0 place-items-center md:mx-0 md:h-52 md:w-52">
                                <svg
                                    className="h-full w-full -rotate-90"
                                    viewBox="0 0 100 100"
                                >
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="42"
                                        fill="none"
                                        stroke="rgba(255,255,255,0.12)"
                                        strokeWidth="6"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="42"
                                        fill="none"
                                        stroke="var(--color-canvas)"
                                        strokeWidth="6"
                                        strokeLinecap="butt"
                                        strokeDasharray={`${(completion / 100) * 264} 264`}
                                        style={{
                                            transition:
                                                "stroke-dasharray 700ms ease-out"
                                        }}
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="tnum text-5xl font-semibold leading-none text-canvas">
                                        {completion}
                                        <span className="text-xl text-canvas/50">%</span>
                                    </span>
                                    <span className="mt-2 font-mono text-[10px] uppercase tracking-wider text-canvas/40">
                                        {submittedCount} / {total} done
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="mb-5 flex items-end justify-between border-b border-ink pb-3">
                            <h2 className="text-2xl text-ink">My courses</h2>
                            <span className="micro">
                                {courses.length}{" "}
                                {courses.length === 1 ? "course" : "courses"}
                            </span>
                        </div>

                        {coursesLoading ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {[0, 1, 2].map((i) => (
                                    <Card
                                        key={i}
                                        className="h-40 animate-pulse-soft px-5 py-5"
                                    >
                                        <div className="h-4 w-16 bg-line-soft" />
                                        <div className="mt-4 h-5 w-3/4 bg-line-soft" />
                                    </Card>
                                ))}
                            </div>
                        ) : courses.length === 0 ? (
                            <Card className="border-dashed px-6 py-14 text-center">
                                <p className="text-lg font-extrabold text-ink">
                                    No courses yet
                                </p>
                                <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
                                    Once your professor enrolls you, your
                                    courses will appear here.
                                </p>
                            </Card>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {courses.map((course) => (
                                    <button
                                        key={course.id}
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                `/student/courses/${course.id}`
                                            )
                                        }
                                        className="group text-left"
                                    >
                                        <Card
                                            hover
                                            className="flex h-full flex-col px-6 py-6"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <span className="font-mono text-xs font-semibold text-accent">
                                                    {course.code}
                                                </span>
                                                <span className="tnum text-[11px] text-ink-faint">
                                                    {course.assignment_count}{" "}
                                                    {course.assignment_count === 1
                                                        ? "task"
                                                        : "tasks"}
                                                </span>
                                            </div>

                                            <h3 className="mt-5 line-clamp-2 text-xl leading-snug text-ink">
                                                {course.name}
                                            </h3>

                                            {course.professor_name && (
                                                <div className="mt-4 flex items-center gap-2">
                                                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-sm border border-line bg-canvas text-[10px] font-bold text-ink-soft">
                                                        {initials(
                                                            course.professor_name
                                                        )}
                                                    </span>
                                                    <span className="truncate text-xs text-ink-muted">
                                                        {course.professor_name}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="mt-auto flex items-center justify-between border-t border-line pt-4 text-xs">
                                                <span className="font-semibold text-ink">
                                                    View assignments
                                                </span>
                                                <span className="text-ink transition-transform duration-150 group-hover:translate-x-1 group-hover:text-accent">
                                                    →
                                                </span>
                                            </div>
                                        </Card>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className="grid gap-10 lg:grid-cols-[1fr_300px] lg:items-start">
                        <section>
                            <div className="mb-2 flex items-end justify-between border-b border-ink pb-3">
                                <h2 className="text-2xl text-ink">Next up</h2>
                                {upcoming.length > 0 && (
                                    <Link
                                        to="/student/assignments"
                                        className="text-xs font-semibold text-ink-muted transition-colors hover:text-accent"
                                    >
                                        View all →
                                    </Link>
                                )}
                            </div>

                            {upcoming.length === 0 ? (
                                <div className="py-14 text-center">
                                    <p className="text-lg font-extrabold text-ink">
                                        You're all caught up
                                    </p>
                                    <p className="mt-1 text-sm text-ink-muted">
                                        No pending assignments right now.
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-line">
                                    {upcoming.map((a, index) => {
                                        const due = dueLabel(a.due_date);
                                        return (
                                            <li
                                                key={a.id}
                                                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-5"
                                            >
                                                <span className="tnum w-6 shrink-0 text-xs text-ink-faint">
                                                    {String(index + 1).padStart(2, "0")}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="truncate text-[15px] font-semibold text-ink">
                                                            {a.title}
                                                        </p>
                                                        <Badge tone={due.tone}>
                                                            {due.text}
                                                        </Badge>
                                                        {a.submission_type === "group" && (
                                                            <Badge tone="neutral">
                                                                Group
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="micro mt-1.5">
                                                        Due {formatDate(a.due_date)}
                                                    </p>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setAsking(a)}
                                                    >
                                                        ✦ Ask AI
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="accent"
                                                        onClick={() => setActive(a)}
                                                    >
                                                        Confirm
                                                    </Button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </section>

                        <aside>
                            <div className="mb-2 flex items-end justify-between border-b border-ink pb-3">
                                <h2 className="text-2xl text-ink">Groups</h2>
                                <Link
                                    to="/student/groups"
                                    className="text-xs font-semibold text-ink-muted transition-colors hover:text-accent"
                                >
                                    Manage →
                                </Link>
                            </div>

                            {groups.length === 0 ? (
                                <p className="py-8 text-center text-sm text-ink-muted">
                                    You haven't joined a group yet.
                                </p>
                            ) : (
                                <ul className="divide-y divide-line">
                                    {groups.map((g) => (
                                        <li
                                            key={g.id}
                                            className="flex items-center justify-between py-3.5"
                                        >
                                            <span className="truncate text-sm font-semibold text-ink">
                                                {g.name}
                                            </span>
                                            <span className="tnum shrink-0 text-xs text-ink-faint">
                                                {g.members?.length || 0} members
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </aside>
                    </div>
                </div>
            )}

            <ConfirmSubmissionModal
                assignment={active}
                onClose={() => setActive(null)}
                onConfirmed={markSubmitted}
            />

            <AskAIModal assignment={asking} onClose={() => setAsking(null)} />
        </>
    );
};

export default StudentDashboard;