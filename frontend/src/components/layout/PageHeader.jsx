const PageHeader = ({ title, subtitle, action, eyebrow }) => (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
            {eyebrow && (
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-muted">
                    {eyebrow}
                </p>
            )}
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {title}
            </h1>
            {subtitle && (
                <p className="mt-2 max-w-2xl text-sm text-ink-muted">{subtitle}</p>
            )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
    </div>
);

export default PageHeader;