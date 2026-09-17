import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { readError } from "../api/client.js";
import AuthShell from "./AuthShell.jsx";
import Button from "../components/ui/Button.jsx";

const Register = () => {
    const { register, login } = useAuth();
    const { push } = useToast();
    const navigate = useNavigate();

    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const change = (event) =>
        setForm({ ...form, [event.target.name]: event.target.value });

    const submit = async (event) => {
        event.preventDefault();
        setError("");

        if (form.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);

        try {
            await register(form);
            await login({ email: form.email, password: form.password });

            push("Account created. Welcome in.");
            navigate("/student", { replace: true });
        } catch (err) {
            setError(readError(err, "Could not create your account."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="Create your student account"
            subtitle="Registration creates a student profile. Professor accounts are issued by the admin team."
            aside="Joineazy — Student, Group & Assignment Management"
        >
            <form onSubmit={submit} className="space-y-4" noValidate>
                <div>
                    <label className="label" htmlFor="name">
                        Full name
                    </label>
                    <input
                        id="name"
                        name="name"
                        required
                        className="field"
                        placeholder="whySokai"
                        value={form.name}
                        onChange={change}
                    />
                </div>

                <div>
                    <label className="label" htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
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
                        className="field"
                        placeholder="At least 6 characters"
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
                    Create account
                </Button>
            </form>

            <p className="mt-6 text-sm text-ink-muted">
                Already registered?{" "}
                <Link to="/login" className="font-medium text-ink underline">
                    Sign in
                </Link>
            </p>
        </AuthShell>
    );
};

export default Register;
