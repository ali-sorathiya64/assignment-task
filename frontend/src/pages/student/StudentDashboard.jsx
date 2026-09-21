import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useStudentAssignments } from "../../hooks/useStudentAssignments.js";
import { courseApi, groupApi } from "../../api/endpoints.js";
import { dueLabel, formatDate, initials } from "../../api/format.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Progress from "../../components/ui/Progress.jsx";
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
            .catch((err) => {
                console.error("Courses load failed:", err?.message);
                setCourses([]);
            })
            .finally(() => setCoursesLoading(false));
    }, []);

    const total = assignments.length;
    const completion = total ? Math.round((submittedCount / total) * 100) : 0;
    const firstName = user?.name?.split(" ")[0] || "there";

    const upcoming = assignments
        .filter((a) => !a.submitted)
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 3);

    return (
        <>
            <PageHeader
                eyebrow="Student"
                title={`Hey, ${firstName}`}
                subtitle="Your courses, assignments, and progress at a glance."
                action={
                    <Link to="/student/assignments">
                        <Button variant="accent" size="sm">
                            All assignments
                        </Button>
                    </Link>
                }
            />

            {loading && <Spinner label="Loading" />}
            {!loading && error && <ErrorState message={error} onRetry={reload} />}

            {!loading && !error && (
                <div className="space-y-8">
                    {/* ---- Row 1: progress + side stats ---- */}
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card className="relative overflow-hidden lg:col-span-2 px-6 py-7">
                            <div
                                className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-[0.04]"
                                style={{
                                    background:
                                        "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)"
                                }}
                            />
                            <div className="flex items-start justify-between gap-6">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                                        Overall progress
                                    </p>

                                    <div className="mt-4 flex items-baseline gap-2">
                                        <span className="font-sans text-5xl font-semibold tabular-nums tracking-tight text-ink">
                                            {submittedCount}
                                        </span>
                                        <span className="font-sans text-2xl font-medium tabular-nums text-ink-faint">
                                            / {total}
                                        </span>
                                    </div>

                                    <p className="mt-2 text-sm text-ink-muted">
                                        assignments confirmed
                                    </p>

                                    <div className="mt-6">
                                        <Progress
                                            value={completion}
                                            tone={
                                                completion === 100
                                                    ? "success"
                                                    : "accent"
                                            }
                                        />
                                        <p className="mt-2 text-xs text-ink-faint">
                                            {completion}% complete
                                        </p>
                                    </div>
                                </div>

                                <div className="hidden shrink-0 sm:block">
                                    <div className="relative grid h-24 w-24 place-items-center">
                                        <svg
                                            className="h-24 w-24 -rotate-90"
                                            viewBox="0 0 100 100"
                                        >
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="42"
                                                fill="none"
                                                stroke="var(--color-line-soft)"
                                                strokeWidth="8"
                                            />
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="42"
                                                fill="none"
                                                stroke={
                                                    completion === 100
                                                        ? "var(--color-success)"
                                                        : "var(--color-accent)"
                                                }
                                                strokeWidth="8"
                                                strokeLinecap="round"
                                                strokeDasharray={`${(completion / 100) * 264} 264`}
                                            />
                                        </svg>
                                        <span className="absolute font-sans text-lg font-semibold tabular-nums text-ink">
                                            {completion}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="grid gap-4">
                            <Card className="px-5 py-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                                        Pending
                                    </p>
                                    <span className="h-2 w-2 rounded-full bg-warn" />
                                </div>
                                <p className="mt-3 font-sans text-2xl font-semibold tabular-nums text-ink">
                                    {pendingCount}
                                </p>
                            </Card>

                            <Card className="px-5 py-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                                        Groups
                                    </p>
                                    <span className="h-2 w-2 rounded-full bg-accent" />
                                </div>
                                <p className="mt-3 font-sans text-2xl font-semibold tabular-nums text-ink">
                                    {groups.length}
                                </p>
                                <p className="mt-1 text-xs text-ink-faint truncate">
                                    {groups[0]?.name || "No group yet"}
                                </p>
                            </Card>
                        </div>
                    </div>

                    {/* ---- Row 2: My Courses ---- */}
                    <section>
                        <div className="mb-4 flex items-end justify-between">
                            <div>
                                <h2 className="font-display text-lg font-bold tracking-tight text-ink">
                                    My courses
                                </h2>
                                <p className="mt-0.5 text-xs text-ink-muted">
                                    Courses you're enrolled in
                                </p>
                            </div>
                            {courses.length > 0 && (
                                <span className="text-xs font-medium text-ink-faint">
                                    {courses.length}{" "}
                                    {courses.length === 1 ? "course" : "courses"}
                                </span>
                            )}
                        </div>

                        {coursesLoading ? (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {[0, 1, 2].map((i) => (
                                    <Card
                                        key={i}
                                        className="h-40 animate-pulse px-5 py-5"
                                    >
                                        <div className="h-5 w-16 rounded bg-line-soft" />
                                        <div className="mt-3 h-4 w-3/4 rounded bg-line-soft" />
                                        <div className="mt-2 h-3 w-1/2 rounded bg-line-soft" />
                                    </Card>
                                ))}
                            </div>
                        ) : courses.length === 0 ? (
                            <Card className="px-6 py-12 text-center">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    </svg>
                                </div>
                                <p className="font-display text-lg font-bold text-ink">
                                    No courses yet
                                </p>
                                <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
                                    Once your professor enrolls you in a course,
                                    it will show up here.
                                </p>
                            </Card>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                                            className="relative h-full overflow-hidden px-5 py-5 transition-all duration-200 group-hover:-translate-y-0.5"
                                        >
                                            <span className="absolute left-0 top-0 h-full w-1 bg-accent" />

                                            <div className="flex items-start justify-between gap-3">
                                                <Badge tone="accent">
                                                    {course.code}
                                                </Badge>
                                                <svg
                                                    className="h-4 w-4 -translate-x-1 text-ink-faint opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
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

                                            <div className="mt-3 flex items-center gap-2">
                                                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent">
                                                    {initials(
                                                        course.professor_name
                                                    )}
                                                </span>
                                                <span className="truncate text-xs text-ink-muted">
                                                    {course.professor_name}
                                                </span>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3">
                                                <span className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                                                    Assignments
                                                </span>
                                                <span className="font-sans text-sm font-semibold tabular-nums text-ink">
                                                    {course.assignment_count}
                                                </span>
                                            </div>
                                        </Card>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ---- Row 3: Next up ---- */}
                    <section>
                        <div className="mb-4 flex items-end justify-between">
                            <div>
                                <h2 className="font-display text-lg font-bold tracking-tight text-ink">
                                    Next up
                                </h2>
                                <p className="mt-0.5 text-xs text-ink-muted">
                                    Pending assignments sorted by due date
                                </p>
                            </div>
                            {upcoming.length > 0 && (
                                <Link
                                    to="/student/assignments"
                                    className="text-xs font-medium text-ink-muted hover:text-ink"
                                >
                                    View all →
                                </Link>
                            )}
                        </div>

                        {upcoming.length === 0 ? (
                            <Card className="px-6 py-12 text-center">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
                                    <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <p className="font-display text-lg font-bold text-ink">
                                    You're all caught up
                                </p>
                                <p className="mt-1 text-sm text-ink-muted">
                                    No pending assignments right now.
                                </p>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                {upcoming.map((a) => {
                                    const due = dueLabel(a.due_date);
                                    return (
                                        <Card
                                            key={a.id}
                                            hover
                                            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="truncate font-medium text-ink">
                                                        {a.title}
                                                    </p>
                                                    <Badge tone={due.tone}>
                                                        {due.text}
                                                    </Badge>
                                                    {a.submission_type ===
                                                        "group" && (
                                                        <Badge tone="neutral">
                                                            Group
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-xs text-ink-muted">
                                                    Due{" "}
                                                    {formatDate(a.due_date)}
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
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </section>
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