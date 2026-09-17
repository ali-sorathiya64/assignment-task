import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { readError } from "../api/client.js";
import AuthShell from "./AuthShell.jsx";
import Button from "../components/ui/Button.jsx";

const Login = () => {
    const { login, user, booting } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (!booting && user) {
        return <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace />;
    }

    const change = (event) =>
        setForm({ ...form, [event.target.name]: event.target.value });

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const loggedIn = await login(form);

            navigate(loggedIn.role === "admin" ? "/admin" : "/student", {
                replace: true
            });
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
            aside="Joineazy — Student, Group & Assignment Management"
        >
            <form onSubmit={submit} className="space-y-4" noValidate>
                <div>
                    <label className="label" htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        className="field"
                        placeholder="you@college.edu"
                        value={form.email}
                        onChange={change}
                    />
                </div>

                <div>
                    <label className="label" htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        autoComplete="current-password"
                        className="field"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={change}
                    />
                </div>

                {error && (
                    <p className="rounded-lg bg-late-soft px-3 py-2 text-sm text-late">
                        {error}
                    </p>
                )}

                <Button type="submit" size="lg" className="w-full" loading={loading}>
                    Sign in
                </Button>
            </form>

            <p className="mt-6 text-sm text-ink-muted">
                New here?{" "}
                <Link to="/register" className="font-medium text-ink underline">
                    Create a student account
                </Link>
            </p>
        </AuthShell>
    );
};

export default Login;
