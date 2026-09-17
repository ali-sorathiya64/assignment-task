import { useCallback, useEffect, useState } from "react";
import { userApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import { formatDate, initials } from "../../api/format.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Card from "../../components/ui/Card.jsx";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States.jsx";

const AdminStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const { data } = await userApi.students();
            setStudents(data.students || []);
        } catch (err) {
            setError(readError(err, "Could not load students."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const term = query.trim().toLowerCase();
    const visible = students.filter(
        (student) =>
            student.name.toLowerCase().includes(term) ||
            student.email.toLowerCase().includes(term)
    );

    return (
        <>
            <PageHeader
                eyebrow="Professor"
                title="Students"
                subtitle="Everyone registered on the platform."
            />

            <div className="mb-5 max-w-sm">
                <input
                    className="field"
                    placeholder="Search by name or email..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                />
            </div>

            {loading && <Spinner label="Loading students" />}
            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && visible.length === 0 && (
                <EmptyState
                    title="No students found"
                    description="Nobody matches that search yet."
                />
            )}

            {!loading && !error && visible.length > 0 && (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-120 text-left text-sm">
                            <thead className="border-b border-line bg-canvas text-xs text-ink-muted">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Student</th>
                                    <th className="px-5 py-3 font-medium">ID</th>
                                    <th className="px-5 py-3 font-medium">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((student) => (
                                    <tr
                                        key={student.id}
                                        className="border-b border-line last:border-0"
                                    >
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-canvas text-xs font-semibold text-ink-soft">
                                                    {initials(student.name)}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-ink">
                                                        {student.name}
                                                    </p>
                                                    <p className="text-xs text-ink-muted">
                                                        {student.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 font-sans tabular-nums text-ink-soft">
                                            {student.id}
                                        </td>
                                        <td className="px-5 py-3 text-xs text-ink-muted">
                                            {formatDate(student.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </>
    );
};

export default AdminStudents;