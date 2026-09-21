import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { assignmentApi, courseApi } from "../../api/endpoints.js";
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
    const [searchParams, setSearchParams] = useSearchParams();
    const courseFilter = searchParams.get("course");

    const [assignments, setAssignments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [assigning, setAssigning] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [assignmentRes, courseRes] = await Promise.all([
                assignmentApi.list(),
                courseApi.myTaught()
            ]);
            setAssignments(assignmentRes.data.assignments || []);
            setCourses(courseRes.data.courses || []);
        } catch (err) {
            setError(readError(err, "Could not load assignments."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const activeCourse = courseFilter
        ? courses.find((c) => String(c.id) === String(courseFilter))
        : null;

    const visible = courseFilter
        ? assignments.filter(
              (a) => String(a.course_id) === String(courseFilter)
          )
        : assignments;

    const clearFilter = () => {
        searchParams.delete("course");
        setSearchParams(searchParams);
    };

    return (
        <>
            <PageHeader
                eyebrow="Professor"
                title={
                    activeCourse
                        ? `${activeCourse.code} · ${activeCourse.name}`
                        : "Assignments"
                }
                subtitle={
                    activeCourse
                        ? "Assignments attached to this course."
                        : "Post work, share the submission link, and track confirmations."
                }
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

            {activeCourse && (
                <div className="mb-5 flex items-center gap-3 rounded-md border border-accent/20 bg-accent-soft/40 px-4 py-2.5">
                    <span className="text-xs font-medium text-accent">
                        Showing assignments for{" "}
                        <strong>{activeCourse.code}</strong>
                    </span>
                    <button
                        onClick={clearFilter}
                        className="ml-auto text-xs font-medium text-accent underline hover:no-underline"
                    >
                        Clear filter
                    </button>
                </div>
            )}

            {loading && <Spinner label="Loading assignments" />}
            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && visible.length === 0 && (
                <EmptyState
                    title={
                        activeCourse
                            ? "No assignments in this course"
                            : "No assignments posted"
                    }
                    description={
                        activeCourse
                            ? "Create an assignment and attach it to this course to see it here."
                            : "Create your first assignment and send it to the cohort, a group, or a single student."
                    }
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

            {!loading && !error && visible.length > 0 && (
                <div className="space-y-2">
                    {visible.map((assignment) => {
                        const due = dueLabel(assignment.due_date);
                        const linkedCourse = assignment.course_id
                            ? courses.find(
                                  (c) =>
                                      String(c.id) ===
                                      String(assignment.course_id)
                              )
                            : null;

                        return (
                            <Card key={assignment.id} hover className="px-5 py-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-display text-base font-bold tracking-tight text-ink">
                                                {assignment.title}
                                            </h3>
                                            {linkedCourse && (
                                                <Badge tone="accent">
                                                    {linkedCourse.code}
                                                </Badge>
                                            )}
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
                                            <Badge tone="neutral">
                                                {assignment.submission_type ===
                                                "group"
                                                    ? "Group"
                                                    : "Individual"}
                                            </Badge>
                                            <Badge tone={due.tone}>
                                                {due.text}
                                            </Badge>
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
                                            onClick={() =>
                                                setAssigning(assignment)
                                            }
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