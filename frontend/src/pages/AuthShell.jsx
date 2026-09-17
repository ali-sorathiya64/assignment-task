import Logo from "../components/layout/Logo.jsx";

const AuthShell = ({ title, subtitle, children, aside }) => (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
        {/* Left brand panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 lg:flex">
            <div className="relative z-10">
                <Logo className="[&_span:last-child]:text-white" linkTo="/login" />
            </div>

            <div className="relative z-10 max-w-md">
                <h2 className="font-display text-4xl font-bold leading-[1.15] tracking-tight text-white">
                    Groups form themselves. Submissions confirm themselves.
                </h2>
                <p className="mt-6 text-sm leading-relaxed text-white/60">
                    Students build their own teams, pick up assignments, and
                    confirm once their work is uploaded. Professors watch the
                    whole cohort move in one place.
                </p>
            </div>

            <div className="relative z-10 flex items-center gap-3">
                <div className="h-1 w-8 rounded-full bg-accent" />
                <p className="text-xs text-white/40">{aside}</p>
            </div>

            {/* Decorative dot grid */}
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                    backgroundSize: "24px 24px"
                }}
            />
        </section>

        {/* Right form panel */}
        <section className="flex min-h-screen items-center justify-center px-5 py-12 lg:px-16">
            <div className="w-full max-w-sm">
                <Logo className="mb-10 lg:hidden" linkTo="/login" />
                <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
                    {title}
                </h1>
                <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>
                <div className="mt-8">{children}</div>
            </div>
        </section>
    </div>
);

export default AuthShell;