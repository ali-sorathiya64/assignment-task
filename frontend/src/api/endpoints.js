import api from "./client.js";

export const authApi = {
    register: (payload) => api.post("/api/auth/register", payload),
    login: (payload) => api.post("/api/auth/login", payload),
    me: () => api.get("/api/auth/me")
};

export const groupApi = {
    myGroups: () => api.get("/api/groups"),
    allGroups: () => api.get("/api/groups/all"),
    create: (name) => api.post("/api/groups", { name }),
    addMember: (groupId, payload) =>
        api.post(`/api/groups/${groupId}/members`, payload)
};

export const userApi = {
    students: () => api.get("/api/users/students")
};

export const courseApi = {
    create: (payload) => api.post("/api/courses", payload),
    myTaught: () => api.get("/api/courses"),
    myEnrolled: () => api.get("/api/courses/my"),
    detail: (courseId) => api.get(`/api/courses/${courseId}`),
    update: (courseId, payload) => api.put(`/api/courses/${courseId}`, payload),
    enrollStudent: (courseId, payload) =>
        api.post(`/api/courses/${courseId}/students`, payload),
    unenrollStudent: (courseId, studentId) =>
        api.delete(`/api/courses/${courseId}/students/${studentId}`)
};

export const assignmentApi = {
    list: () => api.get("/api/assignments"),
    create: (payload) => api.post("/api/assignments", payload),
    update: (assignmentId, payload) =>
        api.put(`/api/assignments/${assignmentId}`, payload),
    assignToGroup: (assignmentId, groupId) =>
        api.post(`/api/assignments/${assignmentId}/groups`, { groupId }),
    assignToStudent: (assignmentId, studentId) =>
        api.post(`/api/assignments/${assignmentId}/students`, { studentId })
};

export const submissionApi = {
    confirm: (assignmentId) =>
        api.post(`/api/submissions/${assignmentId}/confirm`),
    status: (assignmentId) =>
        api.get(`/api/submissions/${assignmentId}/status`)
};

export const analyticsApi = {
    assignment: (assignmentId) =>
        api.get(`/api/analytics/assignments/${assignmentId}`)
};

export const aiApi = {
    chat: (assignmentId, question) =>
        api.post(`/api/ai/chat/${assignmentId}`, { question })
};