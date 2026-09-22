import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { courseApi, userApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDate, initials } from "../../api/format.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States.jsx";

const AdminCourseDetail = () => {
    const { courseId } = useParams();
    const { push } = useToast();

    const [data, setData] = useState(null);
    const [allStudents, setAllStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [enrollOpen, setEnrollOpen] = useState(false);
    const [selectedId, setSelectedId] = useState("");
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [detailRes, studentsRes] = await Promise.all([
                courseApi.detail(courseId),
                userApi.students()
            ]);
            setData(detailRes.data);
            setAllStudents(studentsRes.data.students || []);
        } catch (err) {
            setError(readError(err, "Could not load this course."));
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) return <Spinner label="Loading course" />;
    if (error) return <ErrorState message={error} onRetry={load} />;
    if (!data) return null;

    const { course, students, assignments } = data;

    const enrolledIds = new Set(students.map((s) => s.id));
    const notEnrolled = allStudents.filter((s) => !enrolledIds.has(s.id));

    const enroll = async () => {
        setFormError("");
        setSaving(true);

        try {
            await courseApi.enrollStudent(courseId, {
                studentId: Number(selectedId)
            });
            push("Student enrolled");
            setEnrollOpen(false);
            setSelectedId("");
            load();
        } catch (err) {
            setFormError(readError(err, "Could not enroll that student."));
        } finally {
            setSaving(false);
        }
    };

    const unenroll = async (studentId) => {
        try {
            await courseApi.unenrollStudent(courseId, studentId);
            push("Student unenrolled");
            load();
        } catch (err) {
            push(readError(err, "Could not unenroll."), "error");
        }
    };

    return (
        <>
            <Link
                to="/admin/courses"
                className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
            >
                ← Back to courses
            </Link>

            <PageHeader
                eyebrow={course.code}
                title={course.name}
                subtitle={
                    course.description || "Course details and enrollment"
                }
                action={
                    <Button
                        variant="accent"
                        size="sm"
                        onClick={() => {
                            setFormError("");
                            setEnrollOpen(true);
                        }}
                        disabled={notEnrolled.length === 0}
                    >
                        + Enroll student
                    </Button>
                }
            />

            <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
                {/* LEFT: enrollment */}
                <aside className="space-y-4 lg:sticky lg:top-6">
                    <Card className="px-5 py-5">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                                Enrolled students
                            </p>
                            <span className="font-display text-base font-bold tabular-nums text-ink">
                                {students.length}
                            </span>
                        </div>

                        {students.length === 0 ? (
                            <p className="py-3 text-center text-xs text-ink-faint">
                                No students enrolled yet.
                            </p>
                        ) : (
                            <ul className="space-y-1.5">
                                {students.map((student) => (
                                    <li
                                        key={student.id}
                                        className="flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-canvas"
                                    >
                                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-canvas text-[10px] font-semibold text-ink-soft">
                                            {initials(student.name)}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-ink">
                                                {student.name}
                                            </p>
                                            <p className="truncate text-[11px] text-ink-muted">
                                                {student.email}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => unenroll(student.id)}
                                            className="text-[11px] font-medium text-ink-faint transition-colors hover:text-danger"
                                            title="Unenroll"
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </aside>

                {/* RIGHT: assignments */}
                <div className="min-w-0">
                    <div className="mb-4 flex items-end justify-between">
                        <div>
                            <h2 className="font-display text-lg font-bold tracking-tight text-ink">
                                Assignments in this course
                            </h2>
                            <p className="mt-0.5 text-xs text-ink-muted">
                                Assignments attached to this course
                            </p>
                        </div>
                        <Link
                            to="/admin/assignments"
                            className="text-xs font-medium text-ink-muted transition-colors hover:text-ink"
                        >
                            Manage →
                        </Link>
                    </div>

                    {assignments.length === 0 ? (
                        <EmptyState
                            title="No assignments yet"
                            description="Create an assignment and attach it to this course from the Assignments page."
                        />
                    ) : (
                        <Card className="divide-y divide-line">
                            {assignments.map((a) => (
                                <Link
                                    key={a.id}
                                    to={`/admin/assignments/${a.id}`}
                                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-canvas"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="truncate font-medium text-ink">
                                                {a.title}
                                            </p>
                                            <Badge tone="neutral">
                                                {a.submission_type === "group"
                                                    ? "Group"
                                                    : "Individual"}
                                            </Badge>
                                        </div>
                                        <p className="mt-0.5 text-xs text-ink-muted">
                                            Due {formatDate(a.due_date)}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-xs font-medium text-ink-muted">
                                        Progress →
                                    </span>
                                </Link>
                            ))}
                        </Card>
                    )}
                </div>
            </div>

            {/* Enroll modal */}
            <Modal
                open={enrollOpen}
                onClose={() => setEnrollOpen(false)}
                title="Enroll a student"
                description={course.name}
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setEnrollOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="accent"
                            loading={saving}
                            disabled={!selectedId}
                            onClick={enroll}
                        >
                            Enroll
                        </Button>
                    </>
                }
            >
                <label className="label" htmlFor="student">
                    Student
                </label>
                <select
                    id="student"
                    className="field"
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                >
                    <option value="">Select a student…</option>
                    {notEnrolled.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name} · {s.email}
                        </option>
                    ))}
                </select>

                {formError && (
                    <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                        {formError}
                    </p>
                )}
            </Modal>
        </>
    );
};

export default AdminCourseDetail;