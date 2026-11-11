import { useCallback, useEffect, useState } from "react";
import { groupApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import { formatDate, initials } from "../../api/format.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";
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

            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div className="w-full max-w-sm">
                    <input
                        className="field"
                        placeholder="Search groups..."
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </div>
                <span className="micro">
                    {visible.length} {visible.length === 1 ? "group" : "groups"}
                </span>
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
                <div className="grid gap-5 md:grid-cols-2">
                    {visible.map((group) => {
                        const count = group.members?.length || 0;

                        return (
                            <Card key={group.id} className="flex flex-col">
                                <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-5">
                                    <div className="min-w-0">
                                        <h3 className="truncate text-xl text-ink">
                                            {group.name}
                                        </h3>
                                        <p className="micro mt-2 normal-case">
                                            Created {formatDate(group.created_at)}
                                        </p>
                                    </div>
                                    <Badge tone="neutral">
                                        {count} member{count === 1 ? "" : "s"}
                                    </Badge>
                                </div>

                                <ul className="flex-1 divide-y divide-line-soft px-6">
                                    {(group.members || []).map((member) => {
                                        const leader =
                                            member.is_leader ||
                                            member.id === group.leader_id;

                                        return (
                                            <li
                                                key={member.id}
                                                className="flex items-center gap-3 py-3"
                                            >
                                                <span
                                                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border text-[11px] font-bold ${
                                                        leader
                                                            ? "border-ink bg-ink text-canvas"
                                                            : "border-line bg-canvas text-ink-soft"
                                                    }`}
                                                >
                                                    {initials(member.name)}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-ink">
                                                        {member.name}
                                                        {leader && (
                                                            <span className="ml-1.5 font-mono text-[10px] font-medium uppercase text-accent">
                                                                leader
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="truncate text-xs text-ink-muted">
                                                        {member.email}
                                                    </p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                                <div className="h-3" />
                            </Card>
                        );
                    })}
                </div>
            )}
        </>
    );
};

export default AdminGroups;