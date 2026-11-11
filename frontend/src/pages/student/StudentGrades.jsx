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
                    {/* ============ NEW HERO (transcript style) ============ */}
                    <div className="mb-12 grid gap-px border border-ink bg-ink md:grid-cols-[1.4fr_1fr]">
                        {/* Left — giant average on cream surface */}
                        <div className="bg-surface px-8 py-10 sm:px-10 sm:py-12">
                            <p className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                                <span className="h-2 w-2 bg-accent" />
                                Cumulative average
                            </p>

                            <div className="flex items-baseline gap-2">
                                <p className="tnum text-[96px] font-semibold leading-[0.85] tracking-[-0.055em] text-ink sm:text-[128px]">
                                    {average}
                                </p>
                                <p className="tnum text-3xl font-medium text-ink-faint sm:text-4xl">
                                    %
                                </p>
                            </div>

                            <div className="mt-8 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-6">
                                <div>
                                    <p className="micro">Graded</p>
                                    <p className="tnum mt-1.5 text-2xl font-semibold text-ink">
                                        {graded.length}
                                        <span className="text-sm text-ink-faint">
                                            {" "}/ {grades.length}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <p className="micro">Earned</p>
                                    <p className="tnum mt-1.5 text-2xl font-semibold text-ink">
                                        {totalEarned}
                                    </p>
                                </div>
                                <div>
                                    <p className="micro">Possible</p>
                                    <p className="tnum mt-1.5 text-2xl font-semibold text-ink">
                                        {totalMax}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right — grade band bar chart on ink panel */}
                        <div className="bg-ink px-8 py-10 text-canvas sm:px-10 sm:py-12">
                            <p className="mb-6 font-mono text-[11px] uppercase tracking-wider text-canvas/50">
                                Distribution
                            </p>

                            <div className="flex h-40 items-end gap-2">
                                <BandBar
                                    count={
                                        graded.filter(
                                            (g) =>
                                                (Number(g.score) /
                                                    Number(g.max_score)) *
                                                    100 >=
                                                90
                                        ).length
                                    }
                                    label="90+"
                                />
                                <BandBar
                                    count={
                                        graded.filter((g) => {
                                            const p =
                                                (Number(g.score) /
                                                    Number(g.max_score)) *
                                                100;
                                            return p >= 75 && p < 90;
                                        }).length
                                    }
                                    label="75"
                                />
                                <BandBar
                                    count={
                                        graded.filter((g) => {
                                            const p =
                                                (Number(g.score) /
                                                    Number(g.max_score)) *
                                                100;
                                            return p >= 50 && p < 75;
                                        }).length
                                    }
                                    label="50"
                                />
                                <BandBar
                                    count={
                                        graded.filter(
                                            (g) =>
                                                (Number(g.score) /
                                                    Number(g.max_score)) *
                                                    100 <
                                                50
                                        ).length
                                    }
                                    label="&lt;50"
                                    tone="danger"
                                />
                            </div>

                            <p className="mt-5 border-t border-white/10 pt-3 font-mono text-[10px] uppercase tracking-wider text-canvas/40">
                                Across {graded.length} graded
                            </p>
                        </div>
                    </div>

                    <div className="mb-8 flex gap-6 border-b border-line">
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
                        <div className="space-y-4">
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

/* -------------------- Hero bar chart -------------------- */

const BandBar = ({ count, label, tone = "accent" }) => {
    const height = count === 0 ? 4 : Math.max(10, count * 36);

    const toneClass =
        tone === "danger"
            ? "bg-danger"
            : count === 0
              ? "bg-white/10"
              : "bg-canvas";

    return (
        <div className="flex flex-1 flex-col items-center justify-end gap-2">
            <p className="tnum text-xs font-semibold text-canvas">{count}</p>
            <div
                className={`w-full ${toneClass} transition-[height] duration-500`}
                style={{ height: `${height}px` }}
            />
            <p className="font-mono text-[9px] uppercase tracking-wider text-canvas/50">
                {label}
            </p>
        </div>
    );
};

/* -------------------- Individual grade card (unchanged) -------------------- */

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

    const barClass = {
        success: "bg-success",
        warn: "bg-warn",
        danger: "bg-danger",
        neutral: "bg-line"
    }[tone];

    return (
        <Card className="overflow-hidden">
            <div className="flex flex-col sm:flex-row">
                <div className="min-w-0 flex-1 px-6 py-6">
                    <div className="flex flex-wrap items-center gap-2">
                        {grade.course_code && (
                            <span className="font-mono text-xs font-semibold text-accent">
                                {grade.course_code}
                            </span>
                        )}
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
                                <Badge tone="accent">Common group grade</Badge>
                            )}
                        {!graded && <Badge tone="neutral">Awaiting grade</Badge>}
                    </div>

                    <h3 className="mt-3 text-xl font-extrabold tracking-tight text-ink">
                        {grade.title}
                    </h3>

                    {graded && grade.feedback && (
                        <div className="mt-4 border-l-2 border-accent bg-accent-soft/60 px-4 py-3">
                            <p className="micro text-accent-ink">Feedback</p>
                            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                                {grade.feedback}
                            </p>
                        </div>
                    )}

                    {!graded && (
                        <p className="mt-3 text-xs text-ink-muted">
                            Not graded yet. You'll see the score and feedback
                            here once your professor reviews it.
                        </p>
                    )}
                </div>

                <div
                    className={`flex shrink-0 flex-col justify-between px-8 py-6 sm:w-48 sm:border-l sm:border-ink ${
                        graded ? "bg-ink text-canvas" : "bg-canvas text-ink-faint"
                    }`}
                >
                    <p
                        className={`font-mono text-[10px] uppercase tracking-wider ${
                            graded ? "text-canvas/50" : "text-ink-faint"
                        }`}
                    >
                        Score
                    </p>
                    <div className="my-3">
                        <p className="tnum text-6xl font-semibold leading-none">
                            {graded ? score : "—"}
                        </p>
                        <p
                            className={`tnum mt-2 text-xs ${
                                graded ? "text-canvas/50" : "text-ink-faint"
                            }`}
                        >
                            out of {max}
                        </p>
                    </div>
                    <div className="h-1 w-full bg-white/15">
                        <div
                            className={`h-full ${graded ? barClass : "bg-line"}`}
                            style={{ width: `${graded ? pct : 0}%` }}
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default StudentGrades;