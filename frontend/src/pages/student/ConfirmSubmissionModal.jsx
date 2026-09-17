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

    useEffect(() => {
        setStep(1);
        setError("");
    }, [assignment]);

    if (!assignment) return null;

    const confirm = async () => {
        setLoading(true);
        setError("");

        try {
            await submissionApi.confirm(assignment.id);
            push(`Submission confirmed for ${assignment.title}`);
            onConfirmed(assignment.id);
            onClose();
        } catch (err) {
            setError(readError(err, "Could not confirm your submission."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={step === 1 ? "Have you uploaded your work?" : "Confirm submission"}
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
                        <Button variant="accent" loading={loading} onClick={confirm}>
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
                        through this app. Make sure your work is uploaded before
                        confirming.
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
                        Confirming records you as submitted for this assignment.
                        Your professor sees it immediately and it can't be undone
                        from here.
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