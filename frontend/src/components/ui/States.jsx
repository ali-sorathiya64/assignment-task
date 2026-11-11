import Button from "./Button.jsx";

export const Spinner = ({ label = "Loading" }) => (
    <div className="flex items-center justify-center gap-3 py-24">
        <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="h-2 w-2 animate-pulse-soft bg-accent"
                    style={{ animationDelay: `${i * 160}ms` }}
                />
            ))}
        </span>
        <span className="micro">{label}</span>
    </div>
);

export const ErrorState = ({ message, onRetry }) => (
    <div className="rounded-xl border border-danger/40 bg-danger-soft px-6 py-8 text-center">
        <p className="text-sm font-medium text-danger">{message}</p>
        {onRetry && (
            <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={onRetry}
            >
                Try again
            </Button>
        )}
    </div>
);

export const EmptyState = ({ title, description, action, icon }) => (
    <div className="rounded-xl border border-dashed border-ink-faint bg-surface/50 px-6 py-16 text-center">
        {icon && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-line bg-surface text-ink-muted">
                {icon}
            </div>
        )}
        <h3 className="text-xl font-extrabold tracking-tight text-ink">
            {title}
        </h3>
        {description && (
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
                {description}
            </p>
        )}
        {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
);