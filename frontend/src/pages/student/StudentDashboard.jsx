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
            <PageHeader
                eyebrow={today}
                title={`Hey, ${firstName}`}
                subtitle="Here's your semester at a glance."
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
                <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
                    {/* ================= LEFT: sticky side ================= */}
                    <aside className="space-y-4 lg:sticky lg:top-6">
                        {/* Progress card */}
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
                                            strokeDasharray={`${(completion / 100) * 264} 264`}
                                            style={{
                                                transition:
                                                    "stroke-dasharray 700ms ease-out"
                                            }}
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="font-display text-2xl font-bold tabular-nums leading-none text-ink">
                                            {completion}%
                                        </span>
                                        <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                                            complete
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="mt-5 text-center text-sm text-ink-muted">
                                <span className="font-semibold text-ink">
                                    {submittedCount}
                                </span>{" "}
                                of {total} assignments confirmed
                            </p>
                        </Card>

                        {/* Stat mini grid */}
                        <Card className="divide-y divide-line">
                            <StatRow label="Pending" value={pendingCount} tone="warn" />
                            <StatRow label="Confirmed" value={submittedCount} />
                            <StatRow label="Groups" value={groups.length} />
                            <StatRow label="Courses" value={courses.length} />
                        </Card>

                        {/* Groups list */}
                        <Card className="px-5 py-5">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                                    Your groups
                                </p>
                                <Link
                                    to="/student/groups"
                                    className="text-[11px] font-medium text-ink-muted transition-colors hover:text-ink"
                                >
                                    Manage →
                                </Link>
                            </div>

                            {groups.length === 0 ? (
                                <p className="py-3 text-center text-xs text-ink-faint">
                                    You haven't joined a group yet.
                                </p>
                            ) : (
                                <ul className="space-y-1.5">
                                    {groups.map((g) => (
                                        <li
                                            key={g.id}
                                            className="flex items-center justify-between rounded-md px-2.5 py-2 transition-colors hover:bg-canvas"
                                        >
                                            <span className="truncate text-sm font-medium text-ink">
                                                {g.name}
                                            </span>
                                            <span className="shrink-0 text-[11px] text-ink-faint tabular-nums">
                                                {g.members?.length || 0}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                    </aside>

                    {/* ================= RIGHT: main ================= */}
                    <div className="min-w-0 space-y-8">
                        {/* Courses */}
                        <section>
                            <div className="mb-4 flex items-end justify-between">
                                <div>
                                    <h2 className="font-display text-lg font-bold tracking-tight text-ink">
                                        My courses
                                    </h2>
                                    <p className="mt-0.5 text-xs text-ink-muted">
                                        Click a course to see its assignments
                                    </p>
                                </div>
                                {courses.length > 0 && (
                                    <span className="text-xs font-medium text-ink-faint tabular-nums">
                                        {courses.length}{" "}
                                        {courses.length === 1
                                            ? "course"
                                            : "courses"}
                                    </span>
                                )}
                            </div>

                            {coursesLoading ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {[0, 1].map((i) => (
                                        <Card
                                            key={i}
                                            className="h-36 animate-pulse px-5 py-5"
                                        >
                                            <div className="h-4 w-16 rounded bg-line-soft" />
                                            <div className="mt-3 h-4 w-3/4 rounded bg-line-soft" />
                                        </Card>
                                    ))}
                                </div>
                            ) : courses.length === 0 ? (
                                <Card className="px-6 py-14 text-center">
                                    <p className="font-display text-base font-bold text-ink">
                                        No courses yet
                                    </p>
                                    <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
                                        Once your professor enrolls you, your
                                        courses will appear here.
                                    </p>
                                </Card>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
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
                                                className="flex h-full flex-col px-5 py-5 transition-all duration-200 group-hover:border-accent/40"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <span className="inline-flex items-center rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold tracking-tight text-accent">
                                                        {course.code}
                                                    </span>
                                                    <span className="text-[11px] font-medium text-ink-faint tabular-nums">
                                                        {course.assignment_count}{" "}
                                                        {course.assignment_count ===
                                                        1
                                                            ? "task"
                                                            : "tasks"}
                                                    </span>
                                                </div>

                                                <h3 className="mt-4 font-display text-base font-bold leading-snug tracking-tight text-ink line-clamp-2">
                                                    {course.name}
                                                </h3>

                                                {course.professor_name && (
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-canvas text-[10px] font-semibold text-ink-soft">
                                                            {initials(
                                                                course.professor_name
                                                            )}
                                                        </span>
                                                        <span className="truncate text-xs text-ink-muted">
                                                            {course.professor_name}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="mt-auto flex items-center justify-between pt-4 text-xs">
                                                    <span className="text-ink-muted">
                                                        View assignments
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
                                            </Card>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Next up */}
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
                                        className="text-xs font-medium text-ink-muted transition-colors hover:text-ink"
                                    >
                                        View all →
                                    </Link>
                                )}
                            </div>

                            {upcoming.length === 0 ? (
                                <Card className="px-6 py-14 text-center">
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
                                        <svg
                                            width="24"
                                            height="24"
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
                                    <p className="font-display text-base font-bold text-ink">
                                        You're all caught up
                                    </p>
                                    <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
                                        No pending assignments right now.
                                    </p>
                                </Card>
                            ) : (
                                <Card className="divide-y divide-line">
                                    {upcoming.map((a) => {
                                        const due = dueLabel(a.due_date);
                                        return (
                                            <div
                                                key={a.id}
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
                                                        onClick={() =>
                                                            setAsking(a)
                                                        }
                                                    >
                                                        ✦ Ask AI
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="accent"
                                                        onClick={() =>
                                                            setActive(a)
                                                        }
                                                    >
                                                        Confirm
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </Card>
                            )}
                        </section>
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

const StatRow = ({ label, value, tone }) => {
    const valueClass =
        tone === "warn" ? "text-warn" : "text-ink";

    return (
        <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-xs font-medium text-ink-muted">{label}</span>
            <span
                className={`font-display text-base font-bold tabular-nums ${valueClass}`}
            >
                {value}
            </span>
        </div>
    );
};

export default StudentDashboard;