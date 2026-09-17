import Card from "./Card.jsx";

const StatCard = ({ label, value, hint, accent = false }) => (
    <Card className="px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
            {label}
        </p>
        <p
            className={`mt-3 font-sans text-3xl font-semibold tabular-nums tracking-tight ${
                accent ? "text-accent" : "text-ink"
            }`}
        >
            {value}
        </p>
        {hint && <p className="mt-2 text-xs text-ink-faint">{hint}</p>}
    </Card>
);

export default StatCard;