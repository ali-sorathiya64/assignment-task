const Card = ({ className = "", children, hover = false, ...rest }) => (
    <div
        {...rest}
        className={`rounded-xl border border-line bg-surface shadow-xs
                    ${
                        hover
                            ? "transition-all duration-150 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-ink hover:shadow-md"
                            : ""
                    }
                    ${className}`}
    >
        {children}
    </div>
);

export default Card;