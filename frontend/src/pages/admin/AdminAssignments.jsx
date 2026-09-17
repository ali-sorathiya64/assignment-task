import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { assignmentApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import { dueLabel, formatDate } from "../../api/format.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States.jsx";
import AssignmentFormModal from "./AssignmentFormModal.jsx";
import AssignTargetModal from "./AssignTargetModal.jsx";

const AdminAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [assigning, setAssigning] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const { data } = await assignmentApi.list();
            setAssignments(data.assignments || []);
        } catch (err) {
            setError(readError(err, "Could not load assignments."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <>
            <PageHeader
                eyebrow="Professor"
                title="Assignments"
                subtitle="Post work, share the submission link, and track confirmations."
                action={
                    <Button
                        variant="accent"
                        onClick={() => {
                            setEditing(null);
                            setFormOpen(true);
                        }}
                    >
                        New assignment
                    </Button>
                }
            />

            {loading && <Spinner label="Loading assignments" />}
            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && assignments.length === 0 && (
                <EmptyState
                    title="No assignments posted"
                    description="Create your first assignment and send it to the cohort, a group, or a single student."
                    action={
                        <Button
                            variant="accent"
                            onClick={() => setFormOpen(true)}
                        >
                            New assignment
                        </Button>
                    }
                />
            )}

            {!loading && !error && assignments.length > 0 && (
                <div className="space-y-2">
                    {assignments.map((assignment) => {
                        const due = dueLabel(assignment.due_date);

                        return (
                            <Card key={assignment.id} hover className="px-5 py-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-display text-base font-bold tracking-tight text-ink">
                                                {assignment.title}
                                            </h3>
                                            <Badge
                                                tone={
                                                    assignment.is_global
                                                        ? "accent"
                                                        : "neutral"
                                                }
                                            >
                                                {assignment.is_global
                                                    ? "Whole cohort"
                                                    : "Targeted"}
                                            </Badge>
                                            <Badge tone={due.tone}>{due.text}</Badge>
                                        </div>

                                        {assignment.description && (
                                            <p className="mt-2 max-w-prose text-sm text-ink-soft">
                                                {assignment.description}
                                            </p>
                                        )}

                                        <p className="mt-3 text-xs text-ink-faint">
                                            Due {formatDate(assignment.due_date)}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 lg:shrink-0">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                setEditing(assignment);
                                                setFormOpen(true);
                                            }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setAssigning(assignment)}
                                        >
                                            Assign
                                        </Button>
                                        <Link
                                            to={`/admin/assignments/${assignment.id}`}
                                        >
                                            <Button variant="accent" size="sm">
                                                Progress
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <AssignmentFormModal
                open={formOpen}
                assignment={editing}
                onClose={() => setFormOpen(false)}
                onSaved={load}
            />

            {assigning && (
                <AssignTargetModal
                    assignment={assigning}
                    onClose={() => setAssigning(null)}
                />
            )}
        </>
    );
};

export default AdminAssignments;