const tones = {
    neutral: "bg-line-soft text-ink-soft border-line",
    accent: "bg-accent-soft text-accent-ink border-accent/30",
    success: "bg-success-soft text-success border-success/30",
    warn: "bg-warn-soft text-warn border-warn/30",
    danger: "bg-danger-soft text-danger border-danger/30"
};

const Badge = ({ tone = "neutral", children, className = "" }) => (
    <span
        className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5
                    font-mono text-[10px] font-medium uppercase leading-4 tracking-wider
                    ${tones[tone] || tones.neutral} ${className}`}
    >
        {children}
    </span>
);

export default Badge;