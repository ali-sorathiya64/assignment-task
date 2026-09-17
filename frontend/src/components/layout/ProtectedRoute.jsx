import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { Spinner } from "../ui/States.jsx";

const ProtectedRoute = ({ role, children }) => {
    const { user, booting } = useAuth();
    const location = useLocation();

    if (booting) {
        return <Spinner label="Checking your session" />;
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                state={{ from: location.pathname }}
                replace
            />
        );
    }

    if (role && user.role !== role) {
        return (
            <Navigate
                to={user.role === "admin" ? "/admin" : "/student"}
                replace
            />
        );
    }

    return children;
};

export default ProtectedRoute;