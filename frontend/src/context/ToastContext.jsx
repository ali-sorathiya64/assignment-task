import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

const toneStyles = {
    success: "border-success/20 bg-success-soft text-success",
    error: "border-danger/20 bg-danger-soft text-danger",
    info: "border-line bg-surface text-ink"
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const push = useCallback((message, tone = "success") => {
        const id = Date.now() + Math.random();

        setToasts((current) => [...current, { id, message, tone }]);

        setTimeout(() => {
            setToasts((current) => current.filter((item) => item.id !== id));
        }, 3500);
    }, []);

    return (
        <ToastContext.Provider value={{ push }}>
            {children}

            <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        role="status"
                        className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur animate-toast-in ${
                            toneStyles[toast.tone] || toneStyles.info
                        }`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};