import { useEffect, useState } from "react";
import { assignmentApi, groupApi, userApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
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
                <p className="mb-4 rounded-md bg-accent-soft px-3 py-2 text-xs text-accent">
                    This assignment already goes to every student. Targeting a
                    group is only useful after you switch it off cohort-wide.
                </p>
            )}

            <div className="mb-4 inline-flex rounded-md border border-line bg-canvas p-1">
                {["groups", "students"].map((key) => (
                    <button
                        key={key}
                        onClick={() => {
                            setTab(key);
                            setSelected(null);
                        }}
                        className={`rounded px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                            tab === key
                                ? "bg-surface text-ink shadow-xs"
                                : "text-ink-muted hover:text-ink"
                        }`}
                    >
                        {key}
                    </button>
                ))}
            </div>

            {loading ? (
                <Spinner label="Loading recipients" />
            ) : (
                <div className="space-y-1.5">
                    {rows.length === 0 && (
                        <p className="py-6 text-center text-sm text-ink-muted">
                            Nothing to show here yet.
                        </p>
                    )}

                    {rows.map((row) => (
                        <label
                            key={row.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-all ${
                                selected === row.id
                                    ? "border-accent bg-accent-soft/40"
                                    : "border-line hover:border-ink-faint"
                            }`}
                        >
                            <input
                                type="radio"
                                name="target"
                                className="accent-accent"
                                checked={selected === row.id}
                                onChange={() => setSelected(row.id)}
                            />
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-ink">
                                    {row.name}
                                </span>
                                <span className="block truncate text-xs text-ink-muted">
                                    {tab === "groups"
                                        ? `${row.members?.length || 0} members`
                                        : row.email}
                                </span>
                            </span>
                        </label>
                    ))}
                </div>
            )}

            {error && (
                <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                    {error}
                </p>
            )}
        </Modal>
    );
};

export default AssignTargetModal;