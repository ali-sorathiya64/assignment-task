import { useState } from "react";
import { useStudentAssignments } from "../../hooks/useStudentAssignments.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States.jsx";
import AssignmentCard from "./AssignmentCard.jsx";
import ConfirmSubmissionModal from "./ConfirmSubmissionModal.jsx";

const filters = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "submitted", label: "Confirmed" }
];

const StudentAssignments = () => {
    const {
        assignments,
        loading,
        error,
        reload,
        markSubmitted,
        submittedCount,
        pendingCount
    } = useStudentAssignments();

    const [filter, setFilter] = useState("all");
    const [active, setActive] = useState(null);

    const visible = assignments.filter((assignment) => {
        if (filter === "pending") return !assignment.submitted;
        if (filter === "submitted") return assignment.submitted;
        return true;
    });

    const counts = {
        all: assignments.length,
        pending: pendingCount,
        submitted: submittedCount
    };

    return (
        <>
            <PageHeader
                eyebrow="Student"
                title="Assignments"
                subtitle="Upload your work through the submission link, then confirm it here."
            />

            <div className="mb-6 inline-flex rounded-md border border-line bg-surface p-1">
                {filters.map((item) => (
                    <button
                        key={item.key}
                        onClick={() => setFilter(item.key)}
                        className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                            filter === item.key
                                ? "bg-ink text-white"
                                : "text-ink-soft hover:text-ink"
                        }`}
                    >
                        {item.label}
                        <span
                            className={`ml-1.5 text-xs ${
                                filter === item.key
                                    ? "text-white/60"
                                    : "text-ink-faint"
                            }`}
                        >
                            {counts[item.key]}
                        </span>
                    </button>
                ))}
            </div>

            {loading && <Spinner label="Loading assignments" />}
            {!loading && error && <ErrorState message={error} onRetry={reload} />}

            {!loading && !error && visible.length === 0 && (
                <EmptyState
                    title={
                        filter === "all"
                            ? "Nothing assigned yet"
                            : "Nothing in this view"
                    }
                    description={
                        filter === "all"
                            ? "Assignments appear here once your professor posts them to you, your group, or the whole cohort."
                            : "Switch back to All to see every assignment."
                    }
                />
            )}

            {!loading && !error && visible.length > 0 && (
                <div className="space-y-3">
                    {visible.map((assignment) => (
                        <AssignmentCard
                            key={assignment.id}
                            assignment={assignment}
                            onConfirm={setActive}
                        />
                    ))}
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

export default StudentAssignments;