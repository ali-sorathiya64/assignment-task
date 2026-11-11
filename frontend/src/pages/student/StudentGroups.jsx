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
                <div className="grid gap-4 md:grid-cols-2">
                    {groups.map((group) => {
                        const isLeader = group.leader_id === user?.id;

                        return (
                            <Card key={group.id} className="px-5 py-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-display text-base font-bold tracking-tight text-ink">
                                                {group.name}
                                            </h3>
                                            {isLeader && (
                                                <Badge tone="accent">Leader</Badge>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-ink-muted">
                                            {group.members?.length || 0} member
                                            {group.members?.length === 1
                                                ? ""
                                                : "s"}
                                        </p>
                                    </div>

                                    {isLeader && (
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditing(group);
                                                    setEditName(group.name);
                                                    setFormError("");
                                                }}
                                                className="rounded-md px-2 py-1 text-[11px] font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDeleting(group);
                                                    setFormError("");
                                                }}
                                                className="rounded-md px-2 py-1 text-[11px] font-medium text-danger transition-colors hover:bg-danger-soft"
                                            >
                                                Delete
                                            </button>
                                        </div>
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
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-ink">
                                                    {member.name}
                                                    {member.id === user?.id && (
                                                        <span className="ml-1 text-ink-faint">
                                                            (you)
                                                        </span>
                                                    )}
                                                    {member.is_leader && (
                                                        <span className="ml-1 text-[10px] font-medium text-accent">
                                                            · leader
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
                                                        className="text-[11px] font-medium text-ink-faint transition-colors hover:text-danger"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
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
                                    disabled={!isLeader}
                                >
                                    {isLeader ? "Add member" : "Only leader can add members"}
                                </Button>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create modal */}
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

            {/* Add member modal */}
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
                {formError && (
                    <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                        {formError}
                    </p>
                )}
            </Modal>

            {/* Edit group modal */}
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
                {formError && (
                    <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                        {formError}
                    </p>
                )}
            </Modal>

            {/* Delete group modal */}
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