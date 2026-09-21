import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";
import DashboardLayout from "./components/layout/DashboardLayout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import StudentAssignments from "./pages/student/StudentAssignments.jsx";
import StudentGroups from "./pages/student/StudentGroups.jsx";
import CourseDetail from "./pages/student/CourseDetail.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminAssignments from "./pages/admin/AdminAssignments.jsx";
import AdminAssignmentDetail from "./pages/admin/AdminAssignmentDetail.jsx";
import AdminGroups from "./pages/admin/AdminGroups.jsx";
import AdminStudents from "./pages/admin/AdminStudents.jsx";
import { Spinner } from "./components/ui/States.jsx";

const Landing = () => {
    const { user, booting } = useAuth();

    if (booting) return <Spinner label="Starting up" />;
    if (!user) return <Navigate to="/login" replace />;

    return (
        <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace />
    );
};

const App = () => (
    <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
            path="/student"
            element={
                <ProtectedRoute role="student">
                    <DashboardLayout />
                </ProtectedRoute>
            }
        >
            <Route index element={<StudentDashboard />} />
            <Route path="assignments" element={<StudentAssignments />} />
            <Route path="groups" element={<StudentGroups />} />
            <Route path="courses/:courseId" element={<CourseDetail />} />
        </Route>

        <Route
            path="/admin"
            element={
                <ProtectedRoute role="admin">
                    <DashboardLayout />
                </ProtectedRoute>
            }
        >
            <Route index element={<AdminDashboard />} />
            <Route path="assignments" element={<AdminAssignments />} />
            <Route
                path="assignments/:assignmentId"
                element={<AdminAssignmentDetail />}
            />
            <Route path="groups" element={<AdminGroups />} />
            <Route path="students" element={<AdminStudents />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
);

export default App;