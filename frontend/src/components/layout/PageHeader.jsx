const PageHeader = ({ title, subtitle, action, eyebrow }) => (
    <div className="mb-10 flex flex-col gap-5 border-b border-ink pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
            {eyebrow && (
                <p className="micro mb-4 flex items-center gap-2">
                    <span className="h-2 w-2 bg-accent" />
                    {eyebrow}
                </p>
            )}
            <h1 className="text-4xl text-ink sm:text-[52px]">{title}</h1>
            {subtitle && (
                <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-muted">
                    {subtitle}
                </p>
            )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
    </div>
);

export default PageHeader;