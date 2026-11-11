import { useEffect } from "react";

const Modal = ({ open, onClose, title, description, children, footer }) => {
    useEffect(() => {
        if (!open) return undefined;

        const onKey = (event) => event.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/60 p-0 backdrop-blur-[3px] animate-fade-in sm:items-center sm:p-6">
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="w-full max-w-lg rounded-t-2xl border border-ink bg-surface animate-modal-in sm:rounded-xl sm:shadow-lg"
            >
                <div className="px-7 pb-5 pt-7">
                    <h2 className="text-2xl font-extrabold tracking-tight text-ink">
                        {title}
                    </h2>
                    {description && (
                        <p className="mt-1.5 text-sm text-ink-muted">
                            {description}
                        </p>
                    )}
                </div>

                <div className="scroll-thin max-h-[60vh] overflow-y-auto border-t border-line px-7 py-6">
                    {children}
                </div>

                {footer && (
                    <div className="flex justify-end gap-3 border-t border-line bg-canvas/70 px-7 py-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;