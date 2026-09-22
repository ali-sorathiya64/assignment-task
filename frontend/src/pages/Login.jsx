import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { readError } from "../api/client.js";
import AuthShell from "./AuthShell.jsx";
import Button from "../components/ui/Button.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
    const { login, user, booting } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: "", password: "" });
    const [touched, setTouched] = useState({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const errors = useMemo(() => {
        const e = {};
        if (!form.email) e.email = "Email is required.";
        else if (!EMAIL_RE.test(form.email))
            e.email = "Enter a valid email.";

        if (!form.password) e.password = "Password is required.";
        return e;
    }, [form]);

    const formValid = Object.keys(errors).length === 0;

    if (!booting && user) {
        return (
            <Navigate
                to={user.role === "admin" ? "/admin" : "/student"}
                replace
            />
        );
    }

    const change = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const blur = (event) => {
        const { name } = event.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
    };

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setTouched({ email: true, password: true });

        if (!formValid) return;

        setLoading(true);

        try {
            const loggedIn = await login(form);
            navigate(
                loggedIn.role === "admin" ? "/admin" : "/student",
                { replace: true }
            );
        } catch (err) {
            setError(readError(err, "Could not sign you in."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="Sign in"
            subtitle="Use the email you registered with."
            aside="Joineazy"
        >
            <form onSubmit={submit} className="space-y-4" noValidate>
                <Field
                    id="email"
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="you@college.edu"
                    autoComplete="email"
                    value={form.email}
                    error={touched.email ? errors.email : ""}
                    onChange={change}
                    onBlur={blur}
                />

                <Field
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={form.password}
                    error={touched.password ? errors.password : ""}
                    onChange={change}
                    onBlur={blur}
                />

                {error && (
                    <div className="rounded-lg bg-danger-soft px-3 py-2.5 text-xs text-danger">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    loading={loading}
                    disabled={!formValid}
                >
                    Sign in
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-muted">
                New here?{" "}
                <Link
                    to="/register"
                    className="font-medium text-ink underline underline-offset-4 hover:text-accent"
                >
                    Create an account
                </Link>
            </p>
        </AuthShell>
    );
};

const Field = ({
    id,
    name,
    label,
    type = "text",
    value,
    onChange,
    onBlur,
    error,
    ...rest
}) => {
    const hasError = Boolean(error);

    return (
        <div>
            <label
                htmlFor={id}
                className="mb-1.5 block text-xs font-medium text-ink-soft"
            >
                {label}
            </label>
            <input
                id={id}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                className={`w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint ${
                    hasError
                        ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/15"
                        : "border-line focus:border-accent focus:ring-2 focus:ring-accent/15"
                }`}
                {...rest}
            />
            {hasError && (
                <p className="mt-1.5 text-[11px] text-danger">{error}</p>
            )}
        </div>
    );
};

export default Login;