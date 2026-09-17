const Card = ({ className = "", children, hover = false, ...rest }) => (
    <div
        {...rest}
        className={`rounded-lg border border-line bg-surface shadow-xs
                    ${hover ? "transition-all duration-200 hover:shadow-md hover:border-line-soft" : ""}
                    ${className}`}
    >
        {children}
    </div>
);

export default Card;