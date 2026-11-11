import { Link } from "react-router-dom";

const Logo = ({ className = "", linkTo = "/", dark = false }) => (
    <Link to={linkTo} className={`group flex items-center gap-2.5 ${className}`}>
        <span
            className={`grid h-8 w-8 place-items-center rounded-md border font-display text-[15px] font-extrabold shadow-[2px_2px_0_0_var(--color-accent)] transition-transform duration-100 group-hover:-translate-x-px group-hover:-translate-y-px ${
                dark
                    ? "border-canvas bg-canvas text-ink"
                    : "border-ink bg-ink text-canvas"
            }`}
        >
            J
        </span>
        <span
            className={`font-display text-[17px] font-extrabold tracking-tight ${
                dark ? "text-canvas" : "text-ink"
            }`}
        >
            Joineazy
        </span>
    </Link>
);

export default Logo;