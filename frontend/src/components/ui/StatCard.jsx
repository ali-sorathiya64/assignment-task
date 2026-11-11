import Card from "./Card.jsx";

const StatCard = ({ label, value, hint, accent = false }) => (
    <Card className="px-5 py-5">
        <p className="micro">{label}</p>
        <p
            className={`tnum mt-4 text-5xl font-semibold leading-none ${
                accent ? "text-accent" : "text-ink"
            }`}
        >
            {value}
        </p>
        {hint && <p className="mt-3 text-xs text-ink-muted">{hint}</p>}
    </Card>
);

export default StatCard;