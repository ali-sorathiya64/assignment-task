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
            className={`flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between ${
                submitted
                    ? ""
                    : isGroup
                      ? "border-l-2 border-l-violet-500"
                      : "border-l-2 border-l-accent"
            }`}
        >
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-bold tracking-tight text-ink">
                        {assignment.title}
                    </h3>
                    {assignment.is_global && (
                        <Badge tone="accent">Whole cohort</Badge>
                    )}
                    {isGroup ? (
                        <Badge tone="neutral">Group</Badge>
                    ) : (
                        <Badge tone="neutral">Individual</Badge>
                    )}
                </div>

                {assignment.description && (
                    <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-soft">
                        {assignment.description}
                    </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                    <span>Due {formatDate(assignment.due_date)}</span>
                    <span className="text-ink-faint">·</span>
                    <Badge tone={submitted ? "success" : due.tone}>
                        {submitted ? "Confirmed" : due.text}
                    </Badge>
                </div>

                {helperText && !submitted && (
                    <div className="mt-3 flex items-start gap-2 rounded-md bg-canvas px-3 py-2">
                        <span className="mt-0.5 shrink-0 text-ink-faint">
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                        </span>
                        <p className="text-xs leading-relaxed text-ink-soft">
                            {helperText}
                        </p>
                    </div>
                )}
            </div>

            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:w-52">
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
                    <Badge tone="success" className="justify-center py-1.5">
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