import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { courseApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States.jsx";
import CourseFormModal from "./CourseFormModal.jsx";

const AdminCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const { data } = await courseApi.myTaught();
            setCourses(data.courses || []);
        } catch (err) {
            setError(readError(err, "Could not load courses."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <>
            <PageHeader
                eyebrow="Professor"
                title="Courses"
                subtitle="Create courses and enroll students. Assignments can be attached to a course."
                action={
                    <Button
                        variant="accent"
                        onClick={() => {
                            setEditing(null);
                            setFormOpen(true);
                        }}
                    >
                        New course
                    </Button>
                }
            />

            {loading && <Spinner label="Loading courses" />}
            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && courses.length === 0 && (
                <EmptyState
                    title="No courses yet"
                    description="Create your first course to start enrolling students and attaching assignments."
                    action={
                        <Button
                            variant="accent"
                            onClick={() => setFormOpen(true)}
                        >
                            New course
                        </Button>
                    }
                />
            )}

            {!loading && !error && courses.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                        <Card
                            key={course.id}
                            hover
                            className="flex h-full flex-col px-5 py-5"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <span className="inline-flex items-center rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold tracking-tight text-accent">
                                    {course.code}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditing(course);
                                        setFormOpen(true);
                                    }}
                                    className="text-[11px] font-medium text-ink-muted transition-colors hover:text-ink"
                                >
                                    Edit
                                </button>
                            </div>

                            <h3 className="mt-4 font-display text-base font-bold leading-snug tracking-tight text-ink line-clamp-2">
                                {course.name}
                            </h3>

                            {course.description && (
                                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                                    {course.description}
                                </p>
                            )}

                            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line-soft pt-3">
                                <div>
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-ink-faint">
                                        Students
                                    </p>
                                    <p className="mt-0.5 font-display text-base font-bold tabular-nums text-ink">
                                        {course.student_count}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-ink-faint">
                                        Assignments
                                    </p>
                                    <p className="mt-0.5 font-display text-base font-bold tabular-nums text-ink">
                                        {course.assignment_count}
                                    </p>
                                </div>
                            </div>

                            <Link
                                to={`/admin/courses/${course.id}`}
                                className="mt-4 block"
                            >
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full"
                                >
                                    Manage course
                                </Button>
                            </Link>
                        </Card>
                    ))}
                </div>
            )}

            <CourseFormModal
                open={formOpen}
                course={editing}
                onClose={() => setFormOpen(false)}
                onSaved={load}
            />
        </>
    );
};

export default AdminCourses;