import { Link } from "react-router-dom";

const Logo = ({ className = "", linkTo = "/" }) => (
    <Link to={linkTo} className={`flex items-center gap-2.5 ${className}`}>
        <span className="grid h-9 w-9 place-items-center rounded-md bg-ink font-display text-base font-bold text-white">
            J
        </span>
        <span className="font-display text-[17px] font-bold tracking-tight text-ink">
            Joineazy
        </span>
    </Link>
);

export default Logo;