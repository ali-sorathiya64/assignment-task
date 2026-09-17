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
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/30 p-0 backdrop-blur-sm sm:items-center sm:p-4 animate-fade-in">
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="w-full max-w-lg rounded-t-xl border border-line bg-surface shadow-lg
                           sm:rounded-xl animate-modal-in"
            >
                <div className="border-b border-line px-6 py-5">
                    <h2 className="font-serif text-xl tracking-tight text-ink">
                        {title}
                    </h2>
                    {description && (
                        <p className="mt-1 text-sm text-ink-muted">{description}</p>
                    )}
                </div>

                <div className="max-h-[65vh] overflow-y-auto px-6 py-5">{children}</div>

                {footer && (
                    <div className="flex justify-end gap-2 border-t border-line bg-canvas/50 px-6 py-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;