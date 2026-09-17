import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useStudentAssignments } from "../../hooks/useStudentAssignments.js";
import { groupApi } from "../../api/endpoints.js";
import { dueLabel, formatDate } from "../../api/format.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Progress from "../../components/ui/Progress.jsx";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States.jsx";
import ConfirmSubmissionModal from "./ConfirmSubmissionModal.jsx";

const StudentDashboard = () => {
    const { user } = useAuth();
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
    const [active, setActive] = useState(null);

    useEffect(() => {
        groupApi
            .myGroups()
            .then(({ data }) => setGroups(data.groups || []))
            .catch(() => setGroups([]));
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
                subtitle="Your assignments, groups, and progress at a glance."
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
                <div className="space-y-6">
                    {/* Hero progress block — different layout */}
                    <div className="grid gap-4 lg:grid-cols-3">
                        {/* Left: big progress */}
                        <Card className="lg:col-span-2 px-6 py-7">
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
                                            tone={completion === 100 ? "success" : "accent"}
                                        />
                                        <p className="mt-2 text-xs text-ink-faint">
                                            {completion}% complete
                                        </p>
                                    </div>
                                </div>

                                {/* Right: ring/badge */}
                                <div className="hidden shrink-0 sm:block">
                                    <div className="relative grid h-24 w-24 place-items-center">
                                        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
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

                        {/* Right: two small stats stacked */}
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

                    {/* Next up */}
                    <div>
                        <div className="mb-3 flex items-end justify-between">
                            <h2 className="font-display text-base font-bold tracking-tight text-ink">
                                Next up
                            </h2>
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
                            <Card className="px-6 py-10 text-center">
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
                                            className="flex items-center justify-between gap-4 px-5 py-4"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate font-medium text-ink">
                                                        {a.title}
                                                    </p>
                                                    <Badge tone={due.tone}>
                                                        {due.text}
                                                    </Badge>
                                                </div>
                                                <p className="mt-1 text-xs text-ink-muted">
                                                    Due {formatDate(a.due_date)}
                                                </p>
                                            </div>

                                            <Button
                                                size="sm"
                                                variant="accent"
                                                onClick={() => setActive(a)}
                                            >
                                                Confirm
                                            </Button>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ConfirmSubmissionModal
                assignment={active}
                onClose={() => setActive(null)}
                onConfirmed={markSubmitted}
            />
        </>
    );
};

export default StudentDashboard;