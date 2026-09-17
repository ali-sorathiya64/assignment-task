const tones = {
    neutral: "bg-line-soft text-ink-soft border-line",
    accent: "bg-accent-soft text-accent border-accent/20",
    success: "bg-success-soft text-success border-success/20",
    warn: "bg-warn-soft text-warn border-warn/20",
    danger: "bg-danger-soft text-danger border-danger/20"
};

const Badge = ({ tone = "neutral", children, className = "" }) => (
    <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5
                    text-[11px] font-medium tracking-tight
                    ${tones[tone]} ${className}`}
    >
        {children}
    </span>
);

export default Badge;