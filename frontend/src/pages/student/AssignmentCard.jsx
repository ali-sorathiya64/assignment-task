import { dueLabel, formatDate } from "../../api/format.js";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";

const AssignmentCard = ({ assignment, onConfirm, onAskAI }) => {
    const due = dueLabel(assignment.due_date);
    const submitted = assignment.submitted;

    return (
        <Card
            className={`flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between ${
                submitted ? "" : "border-l-2 border-l-accent"
            }`}
        >
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-bold tracking-tight text-ink">
                        {assignment.title}
                    </h3>
                    {assignment.is_global && <Badge tone="accent">Whole cohort</Badge>}
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

                {!submitted && (
                    <Button
                        size="sm"
                        variant="accent"
                        onClick={() => onConfirm(assignment)}
                    >
                        Confirm submission
                    </Button>
                )}

                {submitted && (
                    <Badge tone="success" className="justify-center py-1.5">
                        ✓ Submitted
                    </Badge>
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