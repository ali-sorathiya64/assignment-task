import { useEffect, useState } from "react";
import { assignmentApi, courseApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import { toIso, toLocalInput } from "../../api/format.js";
import { useToast } from "../../context/ToastContext.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";

const emptyForm = {
    title: "",
    description: "",
    due_date: "",
    onedrive_link: "",
    is_global: true,
    submission_type: "individual",
    course_id: ""
};

const AssignmentFormModal = ({ open, assignment, onClose, onSaved }) => {
    const { push } = useToast();
    const [form, setForm] = useState(emptyForm);
    const [courses, setCourses] = useState([]);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const editing = Boolean(assignment);

    useEffect(() => {
        if (!open) return;

        setError("");
        setForm(
            assignment
                ? {
                      title: assignment.title || "",
                      description: assignment.description || "",
                      due_date: toLocalInput(assignment.due_date),
                      onedrive_link: assignment.onedrive_link || "",
                      is_global: Boolean(assignment.is_global),
                      submission_type:
                          assignment.submission_type === "group"
                              ? "group"
                              : "individual",
                      course_id: assignment.course_id
                          ? String(assignment.course_id)
                          : ""
                  }
                : emptyForm
        );

        courseApi
            .myTaught()
            .then(({ data }) => setCourses(data.courses || []))
            .catch(() => setCourses([]));
    }, [open, assignment]);

    const change = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const save = async () => {
        setError("");

        if (!form.title.trim() || !form.due_date || !form.onedrive_link.trim()) {
            setError("Title, due date, and submission link are all required.");
            return;
        }

        setSaving(true);

        const payload = {
            title: form.title.trim(),
            description: form.description.trim(),
            due_date: toIso(form.due_date),
            onedrive_link: form.onedrive_link.trim(),
            is_global: form.is_global,
            submission_type: form.submission_type,
            course_id: form.course_id ? Number(form.course_id) : null
        };

        try {
            const { data } = editing
                ? await assignmentApi.update(assignment.id, payload)
                : await assignmentApi.create(payload);

            push(editing ? "Assignment updated" : "Assignment created");
            onSaved(data.assignment, editing);
            onClose();
        } catch (err) {
            setError(readError(err, "Could not save the assignment."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={editing ? "Edit assignment" : "New assignment"}
            description="Students upload their work through the link you share here."
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="accent" loading={saving} onClick={save}>
                        {editing ? "Save changes" : "Create assignment"}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div>
                    <label className="label" htmlFor="title">
                        Title
                    </label>
                    <input
                        id="title"
                        name="title"
                        className="field"
                        placeholder="Database Assignment"
                        value={form.title}
                        onChange={change}
                    />
                </div>

                <div>
                    <label className="label" htmlFor="description">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        className="field resize-y"
                        placeholder="What students need to do"
                        value={form.description}
                        onChange={change}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="label" htmlFor="due_date">
                            Due date
                        </label>
                        <input
                            id="due_date"
                            name="due_date"
                            type="datetime-local"
                            className="field"
                            value={form.due_date}
                            onChange={change}
                        />
                    </div>

                    <div>
                        <label className="label" htmlFor="onedrive_link">
                            OneDrive link
                        </label>
                        <input
                            id="onedrive_link"
                            name="onedrive_link"
                            className="field"
                            placeholder="https://..."
                            value={form.onedrive_link}
                            onChange={change}
                        />
                    </div>
                </div>

                <div>
                    <label className="label" htmlFor="course_id">
                        Attach to course
                    </label>
                    <select
                        id="course_id"
                        name="course_id"
                        className="field"
                        value={form.course_id}
                        onChange={change}
                    >
                        <option value="">— No course —</option>
                        {courses.map((course) => (
                            <option key={course.id} value={course.id}>
                                {course.code} · {course.name}
                            </option>
                        ))}
                    </select>
                    {courses.length === 0 && (
                        <p className="mt-1.5 text-xs text-ink-faint">
                            You haven't created any courses yet.
                        </p>
                    )}
                </div>

                <fieldset className="rounded-lg border border-line p-4">
                    <legend className="px-2 text-xs font-medium uppercase tracking-wider text-ink-muted">
                        Submission type
                    </legend>

                    <div className="grid grid-cols-2 gap-2">
                        {[
                            {
                                value: "individual",
                                label: "Individual",
                                hint: "Each student confirms their own work"
                            },
                            {
                                value: "group",
                                label: "Group",
                                hint: "Only the group leader confirms"
                            }
                        ].map((option) => {
                            const active =
                                form.submission_type === option.value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() =>
                                        setForm((current) => ({
                                            ...current,
                                            submission_type: option.value
                                        }))
                                    }
                                    className={`rounded-md border px-3 py-2.5 text-left transition-all ${
                                        active
                                            ? "border-accent bg-accent-soft/40"
                                            : "border-line hover:border-ink-faint"
                                    }`}
                                >
                                    <span
                                        className={`block text-sm font-medium ${
                                            active ? "text-accent" : "text-ink"
                                        }`}
                                    >
                                        {option.label}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-ink-muted">
                                        {option.hint}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </fieldset>

                <fieldset className="rounded-lg border border-line p-4">
                    <legend className="px-2 text-xs font-medium uppercase tracking-wider text-ink-muted">
                        Who gets this
                    </legend>

                    <div className="space-y-1">
                        <label className="flex cursor-pointer items-start gap-3 rounded-md p-2.5 transition-colors hover:bg-canvas">
                            <input
                                type="radio"
                                name="scope"
                                className="mt-1 accent-accent"
                                checked={form.is_global}
                                onChange={() =>
                                    setForm((current) => ({
                                        ...current,
                                        is_global: true
                                    }))
                                }
                            />
                            <span className="text-sm">
                                <span className="font-medium text-ink">
                                    Every student
                                </span>
                                <span className="mt-0.5 block text-xs text-ink-muted">
                                    Visible to the whole cohort immediately.
                                </span>
                            </span>
                        </label>

                        <label className="flex cursor-pointer items-start gap-3 rounded-md p-2.5 transition-colors hover:bg-canvas">
                            <input
                                type="radio"
                                name="scope"
                                className="mt-1 accent-accent"
                                checked={!form.is_global}
                                onChange={() =>
                                    setForm((current) => ({
                                        ...current,
                                        is_global: false
                                    }))
                                }
                            />
                            <span className="text-sm">
                                <span className="font-medium text-ink">
                                    Specific groups or students
                                </span>
                                <span className="mt-0.5 block text-xs text-ink-muted">
                                    Pick them with "Assign" after saving.
                                </span>
                            </span>
                        </label>
                    </div>
                </fieldset>

                {error && (
                    <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                        {error}
                    </p>
                )}
            </div>
        </Modal>
    );
};

export default AssignmentFormModal;