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
    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkEmails, setBulkEmails] = useState("");
    const [bulkResult, setBulkResult] = useState(null);
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

    const bulkEnroll = async () => {
        setFormError("");
        setBulkResult(null);
        setSaving(true);

        const emails = bulkEmails
            .split(/[\s,]+/)
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);

        if (emails.length === 0) {
            setFormError("Add at least one email.");
            setSaving(false);
            return;
        }

        try {
            const { data } = await courseApi.bulkEnrollStudents(courseId, {
                emails
            });
            setBulkResult(data);
            if (data.summary.enrolled > 0) {
                push(
                    `${data.summary.enrolled} student${
                        data.summary.enrolled > 1 ? "s" : ""
                    } enrolled`
                );
            } else {
                push("No new students enrolled", "info");
            }
            load();
        } catch (err) {
            setFormError(readError(err, "Could not bulk enroll."));
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

    const errorBox = formError && (
        <p className="mt-4 rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {formError}
        </p>
    );

    return (
        <>
            <Link
                to="/admin/courses"
                className="micro mb-6 inline-flex items-center gap-1 transition-colors hover:text-accent"
            >
                ← Back to courses
            </Link>

            <PageHeader
                eyebrow={course.code}
                title={course.name}
                subtitle={course.description || "Course details and enrollment"}
                action={
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                setFormError("");
                                setBulkEmails("");
                                setBulkResult(null);
                                setBulkOpen(true);
                            }}
                        >
                            Bulk enroll
                        </Button>
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
                    </div>
                }
            />

            <div className="grid gap-10 lg:grid-cols-[320px_1fr] lg:items-start">
                <aside className="lg:sticky lg:top-24">
                    <div className="mb-2 flex items-end justify-between border-b border-ink pb-3">
                        <h2 className="text-2xl text-ink">Enrolled</h2>
                        <span className="tnum text-2xl font-semibold text-ink">
                            {students.length}
                        </span>
                    </div>

                    {students.length === 0 ? (
                        <p className="py-8 text-center text-sm text-ink-muted">
                            No students enrolled yet.
                        </p>
                    ) : (
                        <ul className="divide-y divide-line">
                            {students.map((student) => (
                                <li
                                    key={student.id}
                                    className="flex items-center gap-3 py-3"
                                >
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line bg-surface text-[11px] font-bold text-ink-soft">
                                        {initials(student.name)}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-ink">
                                            {student.name}
                                        </p>
                                        <p className="truncate text-[11px] text-ink-muted">
                                            {student.email}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => unenroll(student.id)}
                                        className="text-[11px] font-semibold text-ink-faint transition-colors hover:text-danger"
                                        title="Unenroll"
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </aside>

                <div className="min-w-0">
                    <div className="mb-5 flex items-end justify-between border-b border-ink pb-3">
                        <h2 className="text-2xl text-ink">
                            Assignments in this course
                        </h2>
                        <Link
                            to="/admin/assignments"
                            className="text-xs font-semibold text-ink-muted transition-colors hover:text-accent"
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
                                    className="group flex items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-canvas"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="truncate text-[15px] font-semibold text-ink">
                                                {a.title}
                                            </p>
                                            <Badge tone="neutral">
                                                {a.submission_type === "group"
                                                    ? "Group"
                                                    : "Individual"}
                                            </Badge>
                                        </div>
                                        <p className="micro mt-1.5">
                                            Due {formatDate(a.due_date)}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-xs font-semibold text-ink-muted transition-colors group-hover:text-accent">
                                        Progress →
                                    </span>
                                </Link>
                            ))}
                        </Card>
                    )}
                </div>
            </div>

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
                {errorBox}
            </Modal>

            <Modal
                open={bulkOpen}
                onClose={() => {
                    setBulkOpen(false);
                    setBulkResult(null);
                }}
                title="Bulk enroll students"
                description={course.name}
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setBulkOpen(false);
                                setBulkResult(null);
                            }}
                        >
                            Close
                        </Button>
                        <Button
                            variant="accent"
                            loading={saving}
                            disabled={!bulkEmails.trim()}
                            onClick={bulkEnroll}
                        >
                            Enroll all
                        </Button>
                    </>
                }
            >
                <label className="label" htmlFor="bulk-emails">
                    Student emails
                </label>
                <textarea
                    id="bulk-emails"
                    rows={5}
                    className="field resize-y font-mono text-xs"
                    placeholder={`kai@gmail.com\nroot@gmail.com\nharry@gmail.com\n\n— or comma separated —\nkai@gmail.com, root@gmail.com`}
                    value={bulkEmails}
                    onChange={(e) => setBulkEmails(e.target.value)}
                />
                <p className="mt-2 text-xs text-ink-muted">
                    Paste emails separated by commas, spaces, or newlines.
                    Already-enrolled students will be skipped.
                </p>

                {bulkResult && (
                    <div className="mt-5 space-y-4">
                        <div className="grid grid-cols-3 divide-x divide-line rounded-md border border-line">
                            <div className="px-3 py-3 text-center">
                                <p className="micro text-success">Enrolled</p>
                                <p className="tnum mt-1 text-2xl font-semibold text-success">
                                    {bulkResult.summary.enrolled}
                                </p>
                            </div>
                            <div className="px-3 py-3 text-center">
                                <p className="micro text-warn">Skipped</p>
                                <p className="tnum mt-1 text-2xl font-semibold text-warn">
                                    {bulkResult.summary.skipped}
                                </p>
                            </div>
                            <div className="px-3 py-3 text-center">
                                <p className="micro text-danger">Failed</p>
                                <p className="tnum mt-1 text-2xl font-semibold text-danger">
                                    {bulkResult.summary.failed}
                                </p>
                            </div>
                        </div>

                        {bulkResult.failed.length > 0 && (
                            <div>
                                <p className="micro mb-2">Not found</p>
                                <ul className="space-y-1">
                                    {bulkResult.failed.map((f, i) => (
                                        <li
                                            key={i}
                                            className="rounded-sm bg-canvas px-2.5 py-1.5 font-mono text-xs text-ink-soft"
                                        >
                                            {f.email || f.studentId} — {f.reason}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {errorBox}
            </Modal>
        </>
    );
};

export default AdminCourseDetail;