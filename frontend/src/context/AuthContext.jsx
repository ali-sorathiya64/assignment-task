import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState
} from "react";
import { authApi } from "../api/endpoints.js";
import { TOKEN_KEY } from "../api/client.js";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [booting, setBooting] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);

        if (!token) {
            setBooting(false);
            return;
        }

        authApi
            .me()
            .then(({ data }) => setUser(data.user))
            .catch(() => localStorage.removeItem(TOKEN_KEY))
            .finally(() => setBooting(false));
    }, []);

    const login = useCallback(async (credentials) => {
        const { data } = await authApi.login(credentials);
        localStorage.setItem(TOKEN_KEY, data.token);
        setUser(data.user);
        return data.user;
    }, []);

    const register = useCallback((payload) => authApi.register(payload), []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, booting, login, register, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
};