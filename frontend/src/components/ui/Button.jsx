const variants = {
    primary:
        "bg-ink text-canvas border border-ink shadow-[3px_3px_0_0_var(--color-accent)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--color-accent)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
    accent:
        "bg-accent text-white border border-ink shadow-[3px_3px_0_0_var(--color-ink)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
    secondary:
        "bg-surface text-ink border border-line hover:border-ink active:scale-[0.98]",
    ghost: "text-ink-soft hover:bg-line-soft hover:text-ink",
    danger:
        "bg-danger text-white border border-ink shadow-[3px_3px_0_0_var(--color-ink)] hover:-translate-x-px hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
};

const sizes = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-6 text-sm gap-2"
};

const Button = ({
    variant = "primary",
    size = "md",
    loading = false,
    className = "",
    children,
    ...rest
}) => (
    <button
        {...rest}
        disabled={rest.disabled || loading}
        className={`inline-flex items-center justify-center rounded-md font-semibold tracking-tight
                    transition-all duration-100 disabled:pointer-events-none disabled:opacity-40
                    ${variants[variant]} ${sizes[size]} ${className}`}
    >
        {loading && (
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-current" />
        )}
        {children}
    </button>
);

export default Button;