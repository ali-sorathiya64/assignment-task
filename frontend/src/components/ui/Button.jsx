const variants = {
    primary:
        "bg-ink text-white hover:bg-ink-soft active:scale-[0.98] shadow-xs",
    accent:
        "bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-xs",
    secondary:
        "bg-surface text-ink border border-line hover:border-ink-faint hover:bg-canvas",
    ghost:
        "text-ink-soft hover:bg-line-soft hover:text-ink",
    danger:
        "bg-danger text-white hover:bg-danger/90 active:scale-[0.98] shadow-xs"
};

const sizes = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-11 px-5 text-sm gap-2"
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
        className={`inline-flex items-center justify-center rounded-md font-medium tracking-tight
                    transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40
                    ${variants[variant]} ${sizes[size]} ${className}`}
    >
        {loading && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
    </button>
);

export default Button;