import { useEffect, useState } from "react";
import { courseApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import { useToast } from "../../context/ToastContext.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";

const emptyForm = {
    name: "",
    code: "",
    description: ""
};

const CourseFormModal = ({ open, course, onClose, onSaved }) => {
    const { push } = useToast();
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const editing = Boolean(course);

    useEffect(() => {
        if (!open) return;

        setError("");
        setForm(
            course
                ? {
                      name: course.name || "",
                      code: course.code || "",
                      description: course.description || ""
                  }
                : emptyForm
        );
    }, [open, course]);

    const change = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const save = async () => {
        setError("");

        if (!form.name.trim() || !form.code.trim()) {
            setError("Name and code are required.");
            return;
        }

        setSaving(true);

        const payload = {
            name: form.name.trim(),
            code: form.code.trim(),
            description: form.description.trim()
        };

        try {
            if (editing) {
                await courseApi.update(course.id, payload);
                push("Course updated");
            } else {
                await courseApi.create(payload);
                push("Course created");
            }

            onSaved();
            onClose();
        } catch (err) {
            setError(readError(err, "Could not save the course."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={editing ? "Edit course" : "New course"}
            description={
                editing
                    ? "Update the course details."
                    : "Create a course you can enroll students in and attach assignments to."
            }
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="accent" loading={saving} onClick={save}>
                        {editing ? "Save changes" : "Create course"}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                    <div>
                        <label className="label" htmlFor="name">
                            Course name
                        </label>
                        <input
                            id="name"
                            name="name"
                            className="field"
                            placeholder="Database Systems"
                            value={form.name}
                            onChange={change}
                        />
                    </div>

                    <div>
                        <label className="label" htmlFor="code">
                            Code
                        </label>
                        <input
                            id="code"
                            name="code"
                            className="field uppercase"
                            placeholder="CS301"
                            value={form.code}
                            onChange={change}
                            disabled={editing}
                        />
                    </div>
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
                        placeholder="What this course covers"
                        value={form.description}
                        onChange={change}
                    />
                </div>

                {error && (
                    <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                        {error}
                    </p>
                )}
            </div>
        </Modal>
    );
};

export default CourseFormModal;