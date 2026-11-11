import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { gradingApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import { dueLabel, formatDate } from "../../api/format.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States.jsx";

const MAX_PIPS = 40;

const gradedOf = (r) =>
    r.submission_type === "group"
        ? r.group_graded_count
        : r.individual_graded_count;

const stageOf = (r) => {
    if (r.submitted_count === 0) return "empty";
    return gradedOf(r) >= r.submitted_count ? "done" : "open";
};

const byDue = (a, b) => new Date(a.due_date) - new Date(b.due_date);

/* One bar per submission. Solid = graded, hollow = still waiting. */
const Tally = ({ graded, total, tone = "dark", size = "md" }) => {
    const step = Math.max(Math.ceil(total / MAX_PIPS), 1);
    const pips = Math.ceil(total / step);
    const filled = Math.min(Math.round(graded / step), pips);

    const on = tone === "light" ? "bg-white" : "bg-ink";
    const off =
        tone === "light"
            ? "border border-white/50"
            : "border border-ink/40";
    const height = size === "lg" ? "h-9 w-2" : "h-5 w-1.5";

    return (
        <div
            className="flex flex-wrap gap-0.75"
            role="img"
            aria-label={`${graded} of ${total} graded`}
        >
            {Array.from({ length: pips }, (_, i) => (
                <span
                    key={i}
                    className={`${height} ${i < filled ? on : off}`}
                />
            ))}
        </div>
    );
};

const AdminGrading = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [course, setCourse] = useState("all");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const { data } = await gradingApi.dashboard();
            setRows(data.rows || []);
        } catch (err) {
            setError(readError(err, "Could not load grading dashboard."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const courseOptions = useMemo(() => {
        const map = new Map();
        rows.forEach((r) => {
            const key = String(r.course_id ?? "none");
            if (!map.has(key)) {
                map.set(
                    key,
                    r.course_code
                        ? `${r.course_code} · ${r.course_name}`
                        : "No course"
                );
            }
        });
        return [...map.entries()];
    }, [rows]);

    if (loading) return <Spinner label="Loading grading" />;
    if (error) return <ErrorState message={error} onRetry={load} />;

    const scoped = rows.filter(
        (r) => course === "all" || String(r.course_id ?? "none") === course
    );

    const open = scoped.filter((r) => stageOf(r) === "open").sort(byDue);
    const done = scoped.filter((r) => stageOf(r) === "done").sort(byDue);
    const empty = scoped.filter((r) => stageOf(r) === "empty").sort(byDue);

    const nextUp = open[0];
    const queue = open.slice(1);

    const left = open.reduce(
        (s, r) => s + Math.max(r.submitted_count - gradedOf(r), 0),
        0
    );

    return (
        <>
            <PageHeader
                eyebrow="Professor"
                title="Grading"
                subtitle="Work through the queue from the top. The most urgent assignment is always first."
                action={
                    courseOptions.length > 1 && (
                        <select
                            className="field w-full sm:w-64"
                            value={course}
                            onChange={(e) => setCourse(e.target.value)}
                            aria-label="Filter by course"
                        >
                            <option value="all">All courses</option>
                            {courseOptions.map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    )
                }
            />

            {rows.length === 0 ? (
                <EmptyState
                    title="No gradeable assignments"
                    description="Attach assignments to a course to start grading."
                />
            ) : (
                <div className="space-y-14">
                    {nextUp ? (
                        <NextUp row={nextUp} />
                    ) : (
                        <section className="rounded-xl border border-ink bg-success px-8 py-10 text-white shadow-lg sm:px-12">
                            <p className="font-mono text-[11px] uppercase tracking-wider text-white/70">
                                Queue empty
                            </p>
                            <h2 className="mt-4 text-5xl leading-none text-white sm:text-6xl">
                                Nothing left to grade.
                            </h2>
                            <p className="mt-4 max-w-md text-[15px] text-white/80">
                                Every submitted assignment has a grade. New
                                confirmations will show up here.
                            </p>
                        </section>
                    )}

                    {queue.length > 0 && (
                        <section>
                            <div className="mb-2 flex items-end justify-between border-b border-ink pb-3">
                                <h2 className="text-2xl text-ink">Up next</h2>
                                <span className="tnum text-xs text-ink-muted">
                                    {left} left across {open.length}{" "}
                                    {open.length === 1
                                        ? "assignment"
                                        : "assignments"}
                                </span>
                            </div>

                            <ul className="divide-y divide-line">
                                {queue.map((row, index) => (
                                    <QueueRow
                                        key={row.assignment_id}
                                        row={row}
                                        position={index + 2}
                                    />
                                ))}
                            </ul>
                        </section>
                    )}

                    {done.length > 0 && (
                        <section>
                            <div className="mb-2 flex items-end justify-between border-b border-ink pb-3">
                                <h2 className="text-2xl text-ink">Graded</h2>
                                <span className="micro">{done.length}</span>
                            </div>

                            <ul className="divide-y divide-line">
                                {done.map((row) => (
                                    <li key={row.assignment_id}>
                                        <Link
                                            to={`/admin/grading/${row.assignment_id}`}
                                            className="group flex items-center gap-4 py-3.5 transition-colors hover:bg-surface"
                                        >
                                            <span className="grid h-6 w-6 shrink-0 place-items-center border border-ink bg-success text-xs font-bold text-white">
                                                ✓
                                            </span>
                                            <div className="flex min-w-0 flex-1 items-baseline gap-3">
                                                {row.course_code && (
                                                    <span className="font-mono text-[11px] font-semibold text-accent">
                                                        {row.course_code}
                                                    </span>
                                                )}
                                                <span className="truncate text-sm font-semibold text-ink">
                                                    {row.title}
                                                </span>
                                            </div>
                                            <span className="tnum text-xs text-ink-muted">
                                                {row.submitted_count}/
                                                {row.submitted_count}
                                            </span>
                                            <span className="text-xs font-semibold text-ink-muted transition-colors group-hover:text-accent">
                                                Review →
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {empty.length > 0 && (
                        <section>
                            <div className="mb-2 flex items-end justify-between border-b border-ink pb-3">
                                <h2 className="text-2xl text-ink">
                                    Waiting for submissions
                                </h2>
                                <span className="micro">{empty.length}</span>
                            </div>

                            <ul className="divide-y divide-line">
                                {empty.map((row) => {
                                    const due = dueLabel(row.due_date);
                                    return (
                                        <li
                                            key={row.assignment_id}
                                            className="flex items-center gap-4 py-3.5"
                                        >
                                            <span className="h-6 w-6 shrink-0 border border-dashed border-ink-faint" />
                                            <div className="flex min-w-0 flex-1 items-baseline gap-3">
                                                {row.course_code && (
                                                    <span className="font-mono text-[11px] font-semibold text-accent">
                                                        {row.course_code}
                                                    </span>
                                                )}
                                                <span className="truncate text-sm font-semibold text-ink">
                                                    {row.title}
                                                </span>
                                            </div>
                                            <Badge tone={due.tone}>{due.text}</Badge>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    )}
                </div>
            )}
        </>
    );
};

const NextUp = ({ row }) => {
    const graded = gradedOf(row);
    const total = row.submitted_count;
    const remaining = Math.max(total - graded, 0);
    const due = dueLabel(row.due_date);
    const isGroup = row.submission_type === "group";

    return (
        <section className="relative overflow-hidden rounded-xl border border-ink bg-accent text-white shadow-lg">
            <div className="grid gap-10 px-8 py-10 sm:px-12 sm:py-12 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="min-w-0">
                    <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-white/70">
                        <span className="h-2 w-2 bg-white" />
                        01 · Grade next
                    </p>

                    <h2 className="mt-5 text-4xl leading-[1.02] text-white sm:text-5xl">
                        {row.title}
                    </h2>

                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-white/75">
                        {row.course_code && <span>{row.course_code}</span>}
                        <span>{isGroup ? "Group" : "Individual"}</span>
                        <span>{due.text}</span>
                        <span>Max {row.max_score}</span>
                    </div>

                    <div className="mt-8">
                        <Tally
                            graded={graded}
                            total={total}
                            tone="light"
                            size="lg"
                        />
                        <p className="tnum mt-3 text-xs text-white/70">
                            {graded} of {total} graded
                        </p>
                    </div>
                </div>

                <div className="lg:text-right">
                    <p className="tnum text-8xl font-semibold leading-none text-white sm:text-9xl">
                        {remaining}
                    </p>
                    <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-white/70">
                        {remaining === 1 ? "paper to grade" : "papers to grade"}
                    </p>
                    <Link
                        to={`/admin/grading/${row.assignment_id}`}
                        className="mt-7 block lg:inline-block"
                    >
                        <Button variant="primary" size="lg" className="w-full">
                            Start grading →
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

const QueueRow = ({ row, position }) => {
    const graded = gradedOf(row);
    const total = row.submitted_count;
    const remaining = Math.max(total - graded, 0);
    const due = dueLabel(row.due_date);
    const isGroup = row.submission_type === "group";

    return (
        <li>
            <Link
                to={`/admin/grading/${row.assignment_id}`}
                className="group grid items-center gap-4 py-5 transition-colors hover:bg-surface sm:grid-cols-[56px_minmax(0,1fr)_minmax(0,220px)_auto] sm:gap-6"
            >
                <span className="tnum text-3xl font-semibold leading-none text-ink-faint transition-colors group-hover:text-accent">
                    {String(position).padStart(2, "0")}
                </span>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        {row.course_code && (
                            <span className="font-mono text-[11px] font-semibold text-accent">
                                {row.course_code}
                            </span>
                        )}
                        <Badge tone="neutral">
                            {isGroup ? "Group" : "Individual"}
                        </Badge>
                        <Badge tone={due.tone}>{due.text}</Badge>
                    </div>
                    <h3 className="mt-2 truncate text-lg font-extrabold tracking-tight text-ink">
                        {row.title}
                    </h3>
                    <p className="micro mt-1 normal-case">
                        Due {formatDate(row.due_date)}
                    </p>
                </div>

                <div>
                    <Tally graded={graded} total={total} />
                    <p className="tnum mt-2 text-xs text-ink-muted">
                        {graded}/{total} graded
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <p className="tnum text-3xl font-semibold leading-none text-ink">
                        {remaining}
                        <span className="ml-1.5 text-xs font-medium text-ink-muted">
                            left
                        </span>
                    </p>
                    <span className="grid h-9 w-9 place-items-center rounded-md border border-ink bg-surface text-ink shadow-[2px_2px_0_0_var(--color-ink)] transition-all group-hover:-translate-x-px group-hover:-translate-y-px group-hover:bg-accent group-hover:text-white group-hover:shadow-[3px_3px_0_0_var(--color-ink)]">
                        →
                    </span>
                </div>
            </Link>
        </li>
    );
};

export default AdminGrading;