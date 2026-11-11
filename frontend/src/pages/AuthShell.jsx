import Logo from "../components/layout/Logo.jsx";

const Item = ({ index, children }) => (
    <li className="flex items-baseline gap-4 border-t border-white/10 py-4">
        <span className="font-mono text-[11px] text-accent">0{index}</span>
        <span className="text-sm text-canvas/70">{children}</span>
    </li>
);

const AuthShell = ({ title, subtitle, children, aside }) => (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.1fr_1fr]">
        <section className="surface-dark hidden flex-col justify-between rounded-none p-14 lg:flex">
            <div className="flex items-center justify-between">
                <Logo dark linkTo="/login" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-canvas/40">
                    {aside}
                </span>
            </div>

            <div className="max-w-lg">
                <p className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-canvas/50">
                    <span className="h-2 w-2 bg-accent" />
                    Assignment management
                </p>
                <h2 className="font-display text-6xl font-extrabold leading-[0.95] tracking-[-0.045em] text-canvas">
                    A calmer way to run assignments.
                </h2>
                <p className="mt-7 max-w-sm text-[15px] leading-relaxed text-canvas/55">
                    Students form groups, upload their work, and confirm
                    submissions. Professors see every move in real time.
                </p>
            </div>

            <ul className="max-w-lg">
                <Item index={1}>Create groups and invite classmates</Item>
                <Item index={2}>Submit individual or group assignments</Item>
                <Item index={3}>Track progress across every course</Item>
            </ul>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-canvas px-5 py-12 lg:px-16">
            <div className="animate-rise-in w-full max-w-sm">
                <Logo className="mb-12 lg:hidden" linkTo="/login" />

                <div className="mb-9 border-b border-ink pb-7">
                    <h1 className="text-[40px] text-ink">{title}</h1>
                    <p className="mt-3 text-sm text-ink-muted">{subtitle}</p>
                </div>

                {children}
            </div>
        </section>
    </div>
);

export default AuthShell;