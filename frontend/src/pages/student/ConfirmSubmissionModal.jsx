import { useEffect, useState } from "react";
import { submissionApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import { useToast } from "../../context/ToastContext.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";

const ConfirmSubmissionModal = ({ assignment, onClose, onConfirmed }) => {
    const { push } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        setStep(1);
        setError("");
        setSuccess(false);
    }, [assignment]);

    if (!assignment) return null;

    const confirm = async () => {
        setLoading(true);
        setError("");

        try {
            await submissionApi.confirm(assignment.id);

            onConfirmed(assignment.id);
            setSuccess(true);

            setTimeout(() => {
                push(`Submission confirmed for ${assignment.title}`);
                onClose();
            }, 1400);
        } catch (err) {
            setError(readError(err, "Could not confirm your submission."));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Modal
                open
                onClose={() => {}}
                title="Confirmed"
                description={assignment.title}
                footer={null}
            >
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="relative">
                        <span
                            className="absolute inset-0 rounded-full bg-success/20"
                            style={{
                                animation:
                                    "success-ring 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards"
                            }}
                        />
                        <span
                            className="relative grid h-20 w-20 place-items-center rounded-full bg-success text-white"
                            style={{
                                animation:
                                    "success-pop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
                            }}
                        >
                            <svg
                                width="36"
                                height="36"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline
                                    points="20 6 9 17 4 12"
                                    style={{
                                        strokeDasharray: 40,
                                        strokeDashoffset: 40,
                                        animation:
                                            "check-draw 500ms ease-out 200ms forwards"
                                    }}
                                />
                            </svg>
                        </span>
                    </div>

                    <p className="mt-6 font-display text-lg font-bold text-ink">
                        Submission confirmed
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                        Your professor will see it right away.
                    </p>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            open
            onClose={onClose}
            title={
                step === 1
                    ? "Have you uploaded your work?"
                    : "Confirm submission"
            }
            description={assignment.title}
            footer={
                step === 1 ? (
                    <>
                        <Button variant="secondary" onClick={onClose}>
                            Not yet
                        </Button>
                        <Button variant="accent" onClick={() => setStep(2)}>
                            Yes, I've submitted
                        </Button>
                    </>
                ) : (
                    <>
                        <Button variant="secondary" onClick={() => setStep(1)}>
                            Go back
                        </Button>
                        <Button
                            variant="accent"
                            loading={loading}
                            onClick={confirm}
                        >
                            Confirm submission
                        </Button>
                    </>
                )
            }
        >
            {step === 1 ? (
                <div className="space-y-4 text-sm text-ink-soft">
                    <p className="leading-relaxed">
                        Your file is uploaded through the OneDrive link — not
                        through this app. Make sure your work is uploaded
                        before confirming.
                    </p>
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
                </div>
            ) : (
                <div className="space-y-4 text-sm text-ink-soft">
                    <p className="leading-relaxed">
                        Confirming records you as submitted for this
                        assignment. Your professor sees it immediately and it
                        can't be undone from here.
                    </p>
                    {error && (
                        <p className="rounded-md bg-danger-soft px-3 py-2 text-danger">
                            {error}
                        </p>
                    )}
                </div>
            )}
        </Modal>
    );
};

export default ConfirmSubmissionModal;