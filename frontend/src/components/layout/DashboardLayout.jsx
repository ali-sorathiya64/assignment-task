import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { initials } from "../../api/format.js";
import Logo from "./Logo.jsx";
import Button from "../ui/Button.jsx";

const studentNav = [
    { to: "/student", label: "Overview", end: true },
    { to: "/student/assignments", label: "Assignments" },
    { to: "/student/groups", label: "My groups" }
];

const adminNav = [
    { to: "/admin", label: "Overview", end: true },
    { to: "/admin/courses", label: "Courses" },
    { to: "/admin/assignments", label: "Assignments" },
    { to: "/admin/groups", label: "Groups" },
    { to: "/admin/students", label: "Students" }
];

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const links = user?.role === "admin" ? adminNav : studentNav;

    const signOut = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const linkClass = ({ isActive }) =>
        `block rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
            isActive
                ? "bg-ink text-white"
                : "text-ink-soft hover:bg-line-soft hover:text-ink"
        }`;

    return (
        <div className="min-h-screen lg:flex">
            {/* Desktop sidebar */}
            <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
                <div className="px-5 py-6">
                    <Logo />
                </div>

                <nav className="flex-1 space-y-1 px-3">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            className={linkClass}
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="border-t border-line p-4">
                    <div className="mb-3 flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                            {initials(user?.name)}
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">
                                {user?.name}
                            </p>
                            <p className="truncate text-xs text-ink-muted">
                                {user?.role === "admin" ? "Professor" : "Student"}
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={signOut}
                    >
                        Sign out
                    </Button>
                </div>
            </aside>

            {/* Mobile header */}
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                        <Logo />
                        <button
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen((open) => !open)}
                            className="grid h-9 w-9 place-items-center rounded-md border border-line text-ink-soft hover:bg-line-soft"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                {menuOpen ? (
                                    <>
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </>
                                ) : (
                                    <>
                                        <line x1="3" y1="6" x2="21" y2="6" />
                                        <line x1="3" y1="12" x2="21" y2="12" />
                                        <line x1="3" y1="18" x2="21" y2="18" />
                                    </>
                                )}
                            </svg>
                        </button>
                    </div>

                    {menuOpen && (
                        <nav className="space-y-1 border-t border-line px-3 py-3">
                            {links.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    end={link.end}
                                    onClick={() => setMenuOpen(false)}
                                    className={linkClass}
                                >
                                    {link.label}
                                </NavLink>
                            ))}
                            <button
                                onClick={signOut}
                                className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-danger hover:bg-danger-soft"
                            >
                                Sign out
                            </button>
                        </nav>
                    )}
                </header>

                <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;