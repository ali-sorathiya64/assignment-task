import { useCallback, useEffect, useState } from "react";
import { groupApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import { formatDate, initials } from "../../api/format.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Card from "../../components/ui/Card.jsx";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States.jsx";

const AdminGroups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const { data } = await groupApi.allGroups();
            setGroups(data.groups || []);
        } catch (err) {
            setError(readError(err, "Could not load groups."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const visible = groups.filter((group) =>
        group.name.toLowerCase().includes(query.trim().toLowerCase())
    );

    return (
        <>
            <PageHeader
                eyebrow="Professor"
                title="Groups"
                subtitle="Every group students have formed, with their members."
            />

            <div className="mb-5 max-w-sm">
                <input
                    className="field"
                    placeholder="Search groups..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                />
            </div>

            {loading && <Spinner label="Loading groups" />}
            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && visible.length === 0 && (
                <EmptyState
                    title="No groups yet"
                    description="Students create their own groups. They show up here as soon as they do."
                />
            )}

            {!loading && !error && visible.length > 0 && (
                <div className="grid gap-3 md:grid-cols-2">
                    {visible.map((group) => (
                        <Card key={group.id} className="px-5 py-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="font-display text-base font-bold tracking-tight text-ink truncate">
                                        {group.name}
                                    </h3>
                                    <p className="mt-1 text-xs text-ink-muted">
                                        {group.members?.length || 0} member
                                        {group.members?.length === 1 ? "" : "s"} ·
                                        created {formatDate(group.created_at)}
                                    </p>
                                </div>

                                <span className="shrink-0 rounded-full bg-canvas px-2.5 py-1 text-xs font-medium tabular-nums text-ink-soft">
                                    {group.members?.length || 0}
                                </span>
                            </div>

                            <ul className="mt-4 space-y-1.5">
                                {(group.members || []).map((member) => (
                                    <li
                                        key={member.id}
                                        className="flex items-center gap-2.5 rounded-md bg-canvas px-3 py-2"
                                    >
                                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface text-[10px] font-semibold text-ink-soft">
                                            {initials(member.name)}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-ink">
                                                {member.name}
                                            </p>
                                            <p className="truncate text-xs text-ink-muted">
                                                {member.email}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    ))}
                </div>
            )}
        </>
    );
};

export default AdminGroups;