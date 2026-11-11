import { useCallback, useEffect, useState } from "react";
import { gradingApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Card from "../../components/ui/Card.jsx";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States.jsx";

const StudentGrades = () => {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const { data } = await gradingApi.myGrades();
            setGrades(data.grades || []);
        } catch (err) {
            setError(readError(err, "Could not load your grades."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) return <Spinner label="Loading grades" />;
    if (error) return <ErrorState message={error} onRetry={load} />;

    const graded = grades.filter((g) => g.graded);
    const pending = grades.filter((g) => !g.graded);

    const totalEarned = graded.reduce((s, g) => s + Number(g.score), 0);
    const totalMax = graded.reduce((s, g) => s + Number(g.max_score), 0);
    const average = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

    const visible =
        filter === "graded" ? graded : filter === "pending" ? pending : grades;

    const filters = [
        { key: "all", label: "All", count: grades.length },
        { key: "graded", label: "Graded", count: graded.length },
        { key: "pending", label: "Pending", count: pending.length }
    ];

    return (
        <>
            <PageHeader
                eyebrow="Student"
                title="My grades"
                subtitle="Grades and feedback for your assignments."
            />

            {grades.length === 0 ? (
                <EmptyState
                    title="No assignments yet"
                    description="Once your professor posts assignments, they'll appear here."
                />
            ) : (
                <>
                    <div className="mb-6 grid gap-3 sm:grid-cols-3">
                        <Card className="px-5 py-4">
                            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                                Graded
                            </p>
                            <p className="mt-2 font-display text-2xl font-bold tabular-nums text-ink">
                                {graded.length}
                                <span className="text-sm font-medium text-ink-muted">
                                    {" "}/ {grades.length}
                                </span>
                            </p>
                        </Card>
                        <Card className="px-5 py-4">
                            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                                Total score
                            </p>
                            <p className="mt-2 font-display text-2xl font-bold tabular-nums text-ink">
                                {totalEarned}
                                <span className="text-sm font-medium text-ink-muted">
                                    {" "}/ {totalMax}
                                </span>
                            </p>
                        </Card>
                        <Card className="px-5 py-4">
                            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                                Average
                            </p>
                            <p className="mt-2 font-display text-2xl font-bold tabular-nums text-accent">
                                {average}%
                            </p>
                        </Card>
                    </div>

                    <div className="mb-5 inline-flex rounded-md border border-line bg-surface p-1">
                        {filters.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => setFilter(item.key)}
                                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                                    filter === item.key
                                        ? "bg-ink text-white"
                                        : "text-ink-soft hover:text-ink"
                                }`}
                            >
                                {item.label}
                                <span
                                    className={`ml-1.5 text-[10px] ${
                                        filter === item.key
                                            ? "text-white/60"
                                            : "text-ink-faint"
                                    }`}
                                >
                                    {item.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {visible.length === 0 ? (
                        <EmptyState
                            title={
                                filter === "graded"
                                    ? "Nothing graded yet"
                                    : "You're all caught up"
                            }
                            description={
                                filter === "graded"
                                    ? "Your professor hasn't graded any of your submissions yet."
                                    : "No pending assignments right now."
                            }
                        />
                    ) : (
                        <div className="space-y-3">
                            {visible.map((g) => (
                                <GradeCard key={g.assignment_id} grade={g} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </>
    );
};

const GradeCard = ({ grade }) => {
    const graded = grade.graded;
    const score = graded ? Number(grade.score) : null;
    const max = Number(grade.max_score);
    const pct = graded && max > 0 ? Math.round((score / max) * 100) : 0;
    const tone = graded
        ? pct >= 75
            ? "success"
            : pct >= 50
              ? "warn"
              : "danger"
        : "neutral";

    const toneClass = {
        success: "text-success",
        warn: "text-warn",
        danger: "text-danger",
        neutral: "text-ink-faint"
    }[tone];

    const toneBg = {
        success: "bg-success-soft",
        warn: "bg-warn-soft",
        danger: "bg-danger-soft",
        neutral: "bg-canvas"
    }[tone];

    return (
        <Card className="px-5 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        {grade.course_code && (
                            <span className="inline-flex items-center rounded-md bg-accent-soft px-2 py-0.5 text-[10px] font-semibold tracking-tight text-accent">
                                {grade.course_code}
                            </span>
                        )}
                        <h3 className="font-display text-base font-bold tracking-tight text-ink">
                            {grade.title}
                        </h3>
                        <Badge tone="neutral">
                            {grade.submission_type === "group"
                                ? "Group"
                                : "Individual"}
                        </Badge>
                        {grade.has_override && (
                            <Badge tone="warn">Individual override</Badge>
                        )}
                        {graded &&
                            grade.submission_type === "group" &&
                            !grade.has_override && (
                                <Badge tone="accent">
                                    Common group grade
                                </Badge>
                            )}
                        {!graded && (
                            <Badge tone="neutral">Awaiting grade</Badge>
                        )}
                    </div>

                    {graded && grade.feedback && (
                        <div className="mt-3 rounded-md border border-line-soft bg-canvas/60 px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                                Feedback
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                                {grade.feedback}
                            </p>
                        </div>
                    )}

                    {!graded && (
                        <p className="mt-2 text-xs text-ink-muted">
                            Not graded yet. You'll see the score and feedback
                            here once your professor reviews it.
                        </p>
                    )}
                </div>

                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                    <div className={`rounded-xl px-4 py-3 text-right ${toneBg}`}>
                        {graded ? (
                            <>
                                <p
                                    className={`font-display text-3xl font-bold tabular-nums leading-none ${toneClass}`}
                                >
                                    {score}
                                </p>
                                <p className="mt-1 text-[11px] font-medium text-ink-muted">
                                    out of {max}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="font-display text-lg font-bold leading-none text-ink-faint">
                                    —
                                </p>
                                <p className="mt-1 text-[11px] font-medium text-ink-muted">
                                    of {max}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default StudentGrades;