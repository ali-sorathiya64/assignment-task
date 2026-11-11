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
    const [editing, setEditing] = useState(null);
    const [editName, setEditName] = useState("");
    const [deleting, setDeleting] = useState(null);
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

    const saveEdit = async () => {
        setFormError("");
        if (!editName.trim()) {
            setFormError("Group name cannot be empty.");
            return;
        }
        setSaving(true);
        try {
            await groupApi.update(editing.id, { name: editName.trim() });
            push("Group updated");
            setEditing(null);
            setEditName("");
            load();
        } catch (err) {
            setFormError(readError(err, "Could not update group."));
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        setFormError("");
        setSaving(true);
        try {
            await groupApi.remove(deleting.id);
            push("Group deleted");
            setDeleting(null);
            load();
        } catch (err) {
            setFormError(readError(err, "Could not delete group."));
        } finally {
            setSaving(false);
        }
    };

    const removeMember = async (group, memberId) => {
        try {
            await groupApi.removeMember(group.id, memberId);
            push("Member removed");
            load();
        } catch (err) {
            push(readError(err, "Could not remove member."), "error");
        }
    };

    const errorBox = formError && (
        <p className="mt-4 rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {formError}
        </p>
    );

    return (
        <>
            <PageHeader
                eyebrow="Student"
                title="My groups"
                subtitle="Create groups, add classmates, and manage membership."
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
                <div className="grid gap-5 md:grid-cols-2">
                    {groups.map((group) => {
                        const isLeader = group.leader_id === user?.id;

                        return (
                            <Card key={group.id} className="flex flex-col">
                                <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-5">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="truncate text-xl text-ink">
                                                {group.name}
                                            </h3>
                                            {isLeader && (
                                                <Badge tone="accent">Leader</Badge>
                                            )}
                                        </div>
                                        <p className="micro mt-2">
                                            {group.members?.length || 0} member
                                            {group.members?.length === 1 ? "" : "s"}
                                        </p>
                                    </div>

                                    {isLeader && (
                                        <div className="flex shrink-0 gap-1">
                                            <button
                                                type="button"
                                                title="Rename group"
                                                aria-label="Rename group"
                                                onClick={() => {
                                                    setEditing(group);
                                                    setEditName(group.name);
                                                    setFormError("");
                                                }}
                                                className="grid h-8 w-8 place-items-center rounded-md border border-line text-ink-muted transition-colors hover:border-ink hover:text-ink"
                                            >
                                                <svg
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M12 20h9" />
                                                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                title="Delete group"
                                                aria-label="Delete group"
                                                onClick={() => {
                                                    setDeleting(group);
                                                    setFormError("");
                                                }}
                                                className="grid h-8 w-8 place-items-center rounded-md border border-line text-ink-muted transition-colors hover:border-danger hover:bg-danger-soft hover:text-danger"
                                            >
                                                <svg
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                    <path d="M10 11v6M14 11v6" />
                                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <ul className="flex-1 divide-y divide-line-soft px-6">
                                    {(group.members || []).map((member) => (
                                        <li
                                            key={member.id}
                                            className="flex items-center gap-3 py-3"
                                        >
                                            <span
                                                className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border text-[11px] font-bold ${
                                                    member.is_leader
                                                        ? "border-ink bg-ink text-canvas"
                                                        : "border-line bg-canvas text-ink-soft"
                                                }`}
                                            >
                                                {initials(member.name)}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-ink">
                                                    {member.name}
                                                    {member.id === user?.id && (
                                                        <span className="ml-1 font-normal text-ink-faint">
                                                            (you)
                                                        </span>
                                                    )}
                                                    {member.is_leader && (
                                                        <span className="ml-1.5 font-mono text-[10px] font-medium uppercase text-accent">
                                                            leader
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="truncate text-xs text-ink-muted">
                                                    {member.email}
                                                </p>
                                            </div>
                                            {isLeader &&
                                                !member.is_leader &&
                                                member.id !== user?.id && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeMember(
                                                                group,
                                                                member.id
                                                            )
                                                        }
                                                        className="text-[11px] font-semibold text-ink-faint transition-colors hover:text-danger"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                        </li>
                                    ))}
                                </ul>

                                <div className="border-t border-line px-6 py-4">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => {
                                            setFormError("");
                                            setAddingTo(group);
                                        }}
                                        disabled={!isLeader}
                                    >
                                        {isLeader
                                            ? "+ Add member"
                                            : "Only leader can add members"}
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
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
                {errorBox}
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
                    placeholder="kai@college.edu or 2"
                    value={memberInput}
                    onChange={(event) => setMemberInput(event.target.value)}
                />
                <p className="mt-2 text-xs text-ink-muted">
                    Numbers are treated as student ID; anything else as email.
                </p>
                {errorBox}
            </Modal>

            <Modal
                open={Boolean(editing)}
                onClose={() => setEditing(null)}
                title="Edit group name"
                description={editing?.name}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setEditing(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="accent"
                            loading={saving}
                            disabled={!editName.trim()}
                            onClick={saveEdit}
                        >
                            Save
                        </Button>
                    </>
                }
            >
                <label className="label" htmlFor="edit-name">
                    New group name
                </label>
                <input
                    id="edit-name"
                    className="field"
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                />
                {errorBox}
            </Modal>

            <Modal
                open={Boolean(deleting)}
                onClose={() => setDeleting(null)}
                title="Delete group?"
                description={deleting?.name}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDeleting(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            loading={saving}
                            onClick={confirmDelete}
                        >
                            Delete group
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-ink-soft">
                    This will permanently delete <strong>{deleting?.name}</strong>.
                    Groups that have received assignments cannot be deleted.
                </p>
                {errorBox}
            </Modal>
        </>
    );
};

export default StudentGroups;