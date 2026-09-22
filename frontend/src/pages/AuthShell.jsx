import Logo from "../components/layout/Logo.jsx";

const AuthShell = ({ title, subtitle, children, aside }) => (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-12 lg:flex">
            <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-3xl" />

            <div className="pointer-events-none absolute right-0 top-0 h-full w-px bg-linear-to-b from-transparent via-white/10 to-transparent" />

            <div className="relative z-10">
                <Logo
                    className="[&_span:last-child]:text-white"
                    linkTo="/login"
                />
            </div>

            <div className="relative z-10 max-w-md">
                <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-white">
                    A calmer way to run assignments.
                </h2>

                <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/55">
                    Students form groups, upload their work, and confirm
                    submissions. Professors see every move in real time.
                </p>

                <ul className="mt-10 space-y-3 text-sm text-white/60">
                    <Item>Create groups and invite classmates</Item>
                    <Item>Submit individual or group assignments</Item>
                    <Item>Track progress across every course</Item>
                </ul>
            </div>

            <div className="relative z-10 flex items-center gap-3">
                <div className="h-px w-10 bg-white/15" />
                <p className="text-xs font-medium tracking-wide text-white/30">
                    {aside}
                </p>
            </div>

            <div
                className="pointer-events-none absolute inset-0 opacity-[0.025]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                    backgroundSize: "22px 22px"
                }}
            />
        </section>

        <section className="flex min-h-screen items-center justify-center bg-canvas px-5 py-12 lg:px-16">
            <div className="w-full max-w-md">
                <Logo className="mb-10 lg:hidden" linkTo="/login" />

                <div className="mb-8">
                    <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
                        {title}
                    </h1>
                    <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>
                </div>

                {children}
            </div>
        </section>
    </div>
);

const Item = ({ children }) => (
    <li className="flex items-start gap-3">
        <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-violet-400" />
        <span>{children}</span>
    </li>
);

export default AuthShell;