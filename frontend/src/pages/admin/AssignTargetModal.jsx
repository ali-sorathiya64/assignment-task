import { useEffect, useState } from "react";
import { assignmentApi, groupApi, userApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import { initials } from "../../api/format.js";
import { useToast } from "../../context/ToastContext.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { Spinner } from "../../components/ui/States.jsx";

const AssignTargetModal = ({ assignment, onClose }) => {
    const { push } = useToast();

    const [tab, setTab] = useState("groups");
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!assignment) return;

        setLoading(true);
        setSelected(null);
        setError("");

        Promise.all([groupApi.allGroups(), userApi.students()])
            .then(([groupRes, studentRes]) => {
                setGroups(groupRes.data.groups || []);
                setStudents(studentRes.data.students || []);
            })
            .catch((err) => setError(readError(err, "Could not load recipients.")))
            .finally(() => setLoading(false));
    }, [assignment]);

    if (!assignment) return null;

    const assign = async () => {
        setError("");
        setSaving(true);

        try {
            if (tab === "groups") {
                await assignmentApi.assignToGroup(assignment.id, selected);
                push("Assignment sent to the group");
            } else {
                await assignmentApi.assignToStudent(assignment.id, selected);
                push("Assignment sent to the student");
            }

            onClose();
        } catch (err) {
            setError(readError(err, "Could not assign this."));
        } finally {
            setSaving(false);
        }
    };

    const rows = tab === "groups" ? groups : students;

    return (
        <Modal
            open
            onClose={onClose}
            title="Assign to"
            description={assignment.title}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="accent"
                        loading={saving}
                        disabled={!selected}
                        onClick={assign}
                    >
                        Assign
                    </Button>
                </>
            }
        >
            {assignment.is_global && (
                <p className="mb-5 border-l-2 border-ink bg-canvas px-3 py-2 text-xs leading-relaxed text-ink-soft">
                    This assignment already goes to every student. Targeting a
                    group is only useful after you switch it off cohort-wide.
                </p>
            )}

            <div className="mb-5 flex gap-6 border-b border-line">
                {["groups", "students"].map((key) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => {
                            setTab(key);
                            setSelected(null);
                        }}
                        className={`relative -mb-px pb-3 text-sm font-semibold capitalize transition-colors ${
                            tab === key
                                ? "text-ink after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-accent"
                                : "text-ink-muted hover:text-ink"
                        }`}
                    >
                        {key}
                        <span className="tnum ml-2 text-xs text-ink-faint">
                            {key === "groups" ? groups.length : students.length}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <Spinner label="Loading recipients" />
            ) : (
                <div className="space-y-2">
                    {rows.length === 0 && (
                        <p className="py-6 text-center text-sm text-ink-muted">
                            Nothing to show here yet.
                        </p>
                    )}

                    {rows.map((row) => {
                        const active = selected === row.id;

                        return (
                            <label
                                key={row.id}
                                className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors ${
                                    active
                                        ? "border-ink bg-accent-soft shadow-[3px_3px_0_0_var(--color-accent)]"
                                        : "border-line bg-surface hover:border-ink"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="target"
                                    className="accent-accent"
                                    checked={active}
                                    onChange={() => setSelected(row.id)}
                                />
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line bg-canvas text-[10px] font-bold text-ink-soft">
                                    {initials(row.name)}
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-ink">
                                        {row.name}
                                    </span>
                                    <span className="block truncate text-xs text-ink-muted">
                                        {tab === "groups"
                                            ? `${row.members?.length || 0} members`
                                            : row.email}
                                    </span>
                                </span>
                            </label>
                        );
                    })}
                </div>
            )}

            {error && (
                <p className="mt-4 rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                    {error}
                </p>
            )}
        </Modal>
    );
};

export default AssignTargetModal;