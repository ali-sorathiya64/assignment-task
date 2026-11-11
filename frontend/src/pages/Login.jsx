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
            aside="Joineazy / 01"
        >
            <form onSubmit={submit} className="space-y-5" noValidate>
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
                    <div className="rounded-md border border-danger/40 bg-danger-soft px-3 py-2.5 text-xs font-medium text-danger">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    className="w-full"
                    loading={loading}
                    disabled={!formValid}
                >
                    Sign in →
                </Button>
            </form>

            <p className="mt-8 text-center text-sm text-ink-muted">
                New here?{" "}
                <Link
                    to="/register"
                    className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4 hover:text-accent"
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
            <label htmlFor={id} className="label">
                {label}
            </label>
            <input
                id={id}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                className={`field ${
                    hasError
                        ? "border-danger focus:border-danger focus:shadow-[3px_3px_0_0_var(--color-danger)]"
                        : ""
                }`}
                {...rest}
            />
            {hasError && (
                <p className="mt-1.5 font-mono text-[11px] text-danger">
                    {error}
                </p>
            )}
        </div>
    );
};

export default Login;