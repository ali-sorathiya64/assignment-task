import Button from "./Button.jsx";

export const Spinner = ({ label = "Loading" }) => (
    <div className="flex items-center justify-center gap-3 py-20 text-sm text-ink-muted">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-faint border-t-transparent" />
        {label}
    </div>
);

export const ErrorState = ({ message, onRetry }) => (
    <div className="rounded-lg border border-danger/20 bg-danger-soft px-5 py-6 text-center">
        <p className="text-sm text-danger">{message}</p>
        {onRetry && (
            <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
                Try again
            </Button>
        )}
    </div>
);

export const EmptyState = ({ title, description, action, icon }) => (
    <div className="rounded-lg border border-dashed border-line bg-surface px-6 py-16 text-center">
        {icon && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-line-soft text-ink-muted">
                {icon}
            </div>
        )}
        <h3 className="font-serif text-xl tracking-tight text-ink">{title}</h3>
        {description && (
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
                {description}
            </p>
        )}
        {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
);