import { useCallback, useEffect, useState } from "react";
import { groupApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { initials } from "../../api/format.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States.jsx";

const StudentGroups = () => {
    const { user } = useAuth();
    const { push } = useToast();

    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [creating, setCreating] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [addingTo, setAddingTo] = useState(null);
    const [memberInput, setMemberInput] = useState("");
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const { data } = await groupApi.myGroups();
            setGroups(data.groups || []);
        } catch (err) {
            setError(readError(err, "Could not load your groups."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const createGroup = async () => {
        setFormError("");
        setSaving(true);

        try {
            await groupApi.create(groupName);
            push(`Group "${groupName}" created`);
            setCreating(false);
            setGroupName("");
            load();
        } catch (err) {
            setFormError(readError(err, "Could not create the group."));
        } finally {
            setSaving(false);
        }
    };

    const addMember = async () => {
        setFormError("");
        setSaving(true);

        const value = memberInput.trim();
        const payload = /^\d+$/.test(value)
            ? { studentId: Number(value) }
            : { email: value };

        try {
            await groupApi.addMember(addingTo.id, payload);
            push("Member added to the group");
            setAddingTo(null);
            setMemberInput("");
            load();
        } catch (err) {
            setFormError(readError(err, "Could not add that student."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <PageHeader
                eyebrow="Student"
                title="My groups"
                subtitle="Create a group and add classmates by email or student ID."
                action={
                    <Button
                        variant="accent"
                        onClick={() => {
                            setFormError("");
                            setCreating(true);
                        }}
                    >
                        Create group
                    </Button>
                }
            />

            {loading && <Spinner label="Loading your groups" />}
            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && groups.length === 0 && (
                <EmptyState
                    title="You're not in a group yet"
                    description="Create one and add your teammates. Assignments sent to a group reach every member."
                    action={
                        <Button variant="accent" onClick={() => setCreating(true)}>
                            Create group
                        </Button>
                    }
                />
            )}

            {!loading && !error && groups.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {groups.map((group) => (
                        <Card key={group.id} className="px-5 py-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-display text-base font-bold tracking-tight text-ink">
                                        {group.name}
                                    </h3>
                                    <p className="mt-1 text-xs text-ink-muted">
                                        {group.members?.length || 0} member
                                        {group.members?.length === 1 ? "" : "s"}
                                    </p>
                                </div>

                                {group.created_by === user?.id && (
                                    <Badge tone="accent">Owner</Badge>
                                )}
                            </div>

                            <ul className="mt-4 space-y-2">
                                {(group.members || []).map((member) => (
                                    <li
                                        key={member.id}
                                        className="flex items-center gap-3 rounded-md bg-canvas px-3 py-2"
                                    >
                                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-xs font-semibold text-ink-soft">
                                            {initials(member.name)}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-ink">
                                                {member.name}
                                                {member.id === user?.id && (
                                                    <span className="ml-1 text-ink-faint">
                                                        (you)
                                                    </span>
                                                )}
                                            </p>
                                            <p className="truncate text-xs text-ink-muted">
                                                {member.email}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                variant="secondary"
                                size="sm"
                                className="mt-4 w-full"
                                onClick={() => {
                                    setFormError("");
                                    setAddingTo(group);
                                }}
                            >
                                Add member
                            </Button>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                open={creating}
                onClose={() => setCreating(false)}
                title="Create a group"
                description="You are added as the first member automatically."
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setCreating(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="accent"
                            loading={saving}
                            disabled={!groupName.trim()}
                            onClick={createGroup}
                        >
                            Create group
                        </Button>
                    </>
                }
            >
                <label className="label" htmlFor="group-name">
                    Group name
                </label>
                <input
                    id="group-name"
                    className="field"
                    placeholder="Team Alpha"
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                />
                {formError && (
                    <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                        {formError}
                    </p>
                )}
            </Modal>

            <Modal
                open={Boolean(addingTo)}
                onClose={() => setAddingTo(null)}
                title="Add a member"
                description={addingTo?.name}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setAddingTo(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="accent"
                            loading={saving}
                            disabled={!memberInput.trim()}
                            onClick={addMember}
                        >
                            Add member
                        </Button>
                    </>
                }
            >
                <label className="label" htmlFor="member">
                    Student email or ID
                </label>
                <input
                    id="member"
                    className="field"
                    placeholder="riya@college.edu or 2"
                    value={memberInput}
                    onChange={(event) => setMemberInput(event.target.value)}
                />
                <p className="mt-2 text-xs text-ink-muted">
                    Numbers are treated as student ID; anything else as email.
                </p>
                {formError && (
                    <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                        {formError}
                    </p>
                )}
            </Modal>
        </>
    );
};

export default StudentGroups;