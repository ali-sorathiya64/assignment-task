import { dueLabel, formatDate } from "../../api/format.js";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";

const AssignmentCard = ({ assignment, onConfirm, onAskAI }) => {
    const due = dueLabel(assignment.due_date);
    const submitted = assignment.submitted;

    const isGroup = assignment.isGroupAssignment;
    const isLeader = assignment.isLeader;
    const canConfirm = assignment.canConfirm !== false;
    const group = assignment.group;

    let confirmLabel = "Confirm submission";
    let helperText = null;

    if (submitted) {
        confirmLabel = "Confirmed";
    } else if (isGroup && !isLeader) {
        confirmLabel = "Awaiting leader";
        helperText = group?.leader_name
            ? `Only ${group.leader_name} (group leader) can confirm for "${group.name}"`
            : "Only your group leader can confirm this submission";
    } else if (isGroup && isLeader) {
        confirmLabel = "Confirm for group";
        helperText = group?.name
            ? `Your confirmation will mark all members of "${group.name}" as submitted`
            : null;
    }

    return (
        <Card
            hover
            className={`flex flex-col gap-6 px-6 py-6 sm:flex-row sm:items-start sm:justify-between ${
                submitted
                    ? ""
                    : isGroup
                      ? "border-l-4 border-l-ink"
                      : "border-l-4 border-l-accent"
            }`}
        >
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    {assignment.is_global && (
                        <Badge tone="accent">Whole cohort</Badge>
                    )}
                    <Badge tone="neutral">
                        {isGroup ? "Group" : "Individual"}
                    </Badge>
                    <Badge tone={submitted ? "success" : due.tone}>
                        {submitted ? "Confirmed" : due.text}
                    </Badge>
                </div>

                <h3 className="mt-3 text-xl font-extrabold tracking-tight text-ink">
                    {assignment.title}
                </h3>

                {assignment.description && (
                    <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-soft">
                        {assignment.description}
                    </p>
                )}

                <p className="micro mt-4">
                    Due <span className="text-ink">{formatDate(assignment.due_date)}</span>
                </p>

                {helperText && !submitted && (
                    <p className="mt-4 border-l-2 border-ink bg-canvas px-3 py-2 text-xs leading-relaxed text-ink-soft">
                        {helperText}
                    </p>
                )}
            </div>

            <div className="flex shrink-0 flex-col items-stretch gap-2.5 sm:w-48">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                        window.open(
                            assignment.onedrive_link,
                            "_blank",
                            "noopener,noreferrer"
                        )
                    }
                >
                    Open submission link
                </Button>

                {submitted ? (
                    <Badge tone="success" className="justify-center py-2">
                        ✓ Submitted
                    </Badge>
                ) : canConfirm ? (
                    <Button
                        size="sm"
                        variant="accent"
                        onClick={() => onConfirm(assignment)}
                    >
                        {confirmLabel}
                    </Button>
                ) : (
                    <Button size="sm" variant="secondary" disabled>
                        {confirmLabel}
                    </Button>
                )}

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAskAI(assignment)}
                    className="justify-center"
                >
                    ✦ Ask AI
                </Button>
            </div>
        </Card>
    );
};

export default AssignmentCard;