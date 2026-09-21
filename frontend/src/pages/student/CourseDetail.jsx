import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { courseApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import { submissionApi } from "../../api/endpoints.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Card from "../../components/ui/Card.jsx";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States.jsx";
import AssignmentCard from "./AssignmentCard.jsx";
import ConfirmSubmissionModal from "./ConfirmSubmissionModal.jsx";
import AskAIModal from "./AskAIModal.jsx";

const CourseDetail = () => {
    const { courseId } = useParams();

    const [course, setCourse] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [active, setActive] = useState(null);
    const [asking, setAsking] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const { data } = await courseApi.detail(courseId);
            const list = data.assignments || [];

            const statuses = await Promise.all(
                list.map((assignment) =>
                    submissionApi
                        .status(assignment.id)
                        .then(({ data: status }) => ({
                            submitted: Boolean(status.submitted),
                            isGroupAssignment: Boolean(status.is_group_assignment),
                            isLeader: Boolean(status.is_leader),
                            canConfirm: status.can_confirm !== false,
                            group: status.group || null
                        }))
                        .catch(() => ({
                            submitted: false,
                            isGroupAssignment: false,
                            isLeader: false,
                            canConfirm: true,
                            group: null
                        }))
                )
            );

            setCourse(data.course);
            setAssignments(
                list.map((assignment, index) => ({
                    ...assignment,
                    ...statuses[index]
                }))
            );
        } catch (err) {
            setError(readError(err, "Could not load this course."));
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        load();
    }, [load]);

    const markSubmitted = useCallback((assignmentId) => {
        setAssignments((current) =>
            current.map((assignment) =>
                assignment.id === assignmentId
                    ? { ...assignment, submitted: true }
                    : assignment
            )
        );
    }, []);

    if (loading) return <Spinner label="Loading course" />;
    if (error) return <ErrorState message={error} onRetry={load} />;
    if (!course) return null;

    const submittedCount = assignments.filter((a) => a.submitted).length;

    return (
        <>
            <Link
                to="/student"
                className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
            >
                ← Back to dashboard
            </Link>

            <PageHeader
                eyebrow={course.code}
                title={course.name}
                subtitle={
                    course.professor_name
                        ? `Taught by ${course.professor_name}`
                        : "Course assignments"
                }
                action={
                    <Badge tone="accent">
                        {submittedCount} / {assignments.length} submitted
                    </Badge>
                }
            />

            {course.description && (
                <Card className="mb-6 px-6 py-5">
                    <p className="max-w-prose text-sm leading-relaxed text-ink-soft">
                        {course.description}
                    </p>
                </Card>
            )}

            <h2 className="mb-3 font-display text-base font-bold tracking-tight text-ink">
                Assignments
            </h2>

            {assignments.length === 0 ? (
                <EmptyState
                    title="No assignments yet"
                    description="Your professor hasn't posted anything to this course yet."
                />
            ) : (
                <div className="space-y-3">
                    {assignments.map((assignment) => (
                        <AssignmentCard
                            key={assignment.id}
                            assignment={assignment}
                            onConfirm={setActive}
                            onAskAI={setAsking}
                        />
                    ))}
                </div>
            )}

            <ConfirmSubmissionModal
                assignment={active}
                onClose={() => setActive(null)}
                onConfirmed={markSubmitted}
            />

            <AskAIModal
                assignment={asking}
                onClose={() => setAsking(null)}
            />
        </>
    );
};

export default CourseDetail;