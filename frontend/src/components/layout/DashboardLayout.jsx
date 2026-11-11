import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { initials } from "../../api/format.js";
import Logo from "./Logo.jsx";

const studentNav = [
    { to: "/student", label: "Overview", end: true },
    { to: "/student/assignments", label: "Assignments" },
    { to: "/student/groups", label: "My groups" },
    { to: "/student/grades", label: "My grades" }
];

const adminNav = [
    { to: "/admin", label: "Overview", end: true },
    { to: "/admin/courses", label: "Courses" },
    { to: "/admin/assignments", label: "Assignments" },
    { to: "/admin/groups", label: "Groups" },
    { to: "/admin/students", label: "Students" },
    { to: "/admin/grading", label: "Grading" }
];

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const isAdmin = user?.role === "admin";
    const links = isAdmin ? adminNav : studentNav;

    const signOut = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const desktopLink = ({ isActive }) =>
        `relative flex h-16 items-center px-3.5 text-[13px] font-semibold transition-colors duration-150 ${
            isActive
                ? "text-ink after:absolute after:inset-x-3.5 after:bottom-0 after:h-0.5 after:bg-accent"
                : "text-ink-muted hover:text-ink"
        }`;

    const mobileLink = ({ isActive }) =>
        `block rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
            isActive
                ? "bg-accent-soft text-accent-ink"
                : "text-ink-soft hover:bg-line-soft"
        }`;

    return (
        <div className="min-h-screen">
            <header className="sticky top-0 z-30 border-b border-ink bg-canvas/90 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-10">
                    <Logo />

                    <nav className="hidden h-16 flex-1 items-center lg:flex">
                        {links.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.end}
                                className={desktopLink}
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="ml-auto hidden items-center gap-3 lg:flex">
                        <span className="micro rounded-sm border border-line bg-surface px-2 py-1">
                            {isAdmin ? "Professor" : "Student"}
                        </span>
                        <span className="grid h-8 w-8 place-items-center rounded-md border border-ink bg-surface text-[11px] font-bold text-ink">
                            {initials(user?.name)}
                        </span>
                        <div className="leading-tight">
                            <p className="max-w-32 truncate text-xs font-semibold text-ink">
                                {user?.name}
                            </p>
                            <button
                                onClick={signOut}
                                className="text-[11px] text-ink-muted transition-colors hover:text-danger"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>

                    <button
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((open) => !open)}
                        className="ml-auto grid h-9 w-9 place-items-center rounded-md border border-ink bg-surface text-ink lg:hidden"
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
                                    <line x1="3" y1="7" x2="21" y2="7" />
                                    <line x1="3" y1="17" x2="21" y2="17" />
                                </>
                            )}
                        </svg>
                    </button>
                </div>

                {menuOpen && (
                    <nav className="animate-fade-in space-y-1 border-t border-line bg-canvas px-4 py-3 lg:hidden">
                        {links.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.end}
                                onClick={() => setMenuOpen(false)}
                                className={mobileLink}
                            >
                                {link.label}
                            </NavLink>
                        ))}
                        <div className="mt-2 flex items-center justify-between border-t border-line px-3 pt-3">
                            <span className="text-xs font-semibold text-ink">
                                {user?.name}
                            </span>
                            <button
                                onClick={signOut}
                                className="text-xs font-semibold text-danger"
                            >
                                Sign out
                            </button>
                        </div>
                    </nav>
                )}
            </header>

            <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;