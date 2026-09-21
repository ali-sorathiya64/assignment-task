import { useCallback, useEffect, useState } from "react";
import { assignmentApi, submissionApi } from "../api/endpoints.js";
import { readError } from "../api/client.js";

export const useStudentAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const { data } = await assignmentApi.list();
            const list = data.assignments || [];

            const statuses = await Promise.all(
                list.map((assignment) =>
                    submissionApi
                        .status(assignment.id)
                        .then(({ data: status }) => ({
                            submitted: Boolean(status.submitted),
                            isGroupAssignment: Boolean(
                                status.is_group_assignment
                            ),
                            isLeader: Boolean(status.is_leader),
                            canConfirm: status.can_confirm !== false,
                            group: status.group || null
                        }))
                        .catch(() => ({
                            submitted: false,
                            isGroupAssignment: false,
                            isLeader: false,
                            canConfirm: true,
                            group: null
                        }))
                )
            );

            setAssignments(
                list.map((assignment, index) => ({
                    ...assignment,
                    ...statuses[index]
                }))
            );
        } catch (err) {
            setError(readError(err, "Could not load your assignments."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const markSubmitted = useCallback((assignmentId) => {
        setAssignments((current) =>
            current.map((assignment) =>
                assignment.id === assignmentId
                    ? { ...assignment, submitted: true }
                    : assignment
            )
        );
    }, []);

    const submittedCount = assignments.filter((item) => item.submitted).length;

    return {
        assignments,
        loading,
        error,
        reload: load,
        markSubmitted,
        submittedCount,
        pendingCount: assignments.length - submittedCount
    };
};