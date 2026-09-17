const tones = {
    accent: "bg-accent",
    success: "bg-success",
    warn: "bg-warn",
    danger: "bg-danger"
};

const Progress = ({ value = 0, tone = "accent" }) => {
    const width = Math.min(Math.max(value, 0), 100);

    return (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line-soft">
            <div
                className={`h-full rounded-full transition-[width] duration-700 ease-out ${tones[tone]}`}
                style={{ width: `${width}%` }}
            />
        </div>
    );
};

export default Progress;