import { useState, useEffect, createContext, useContext } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (api.token) {
            api.getProfile()
                .then(data => setUser(data.user))
                .catch(() => api.setToken(null))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (credentials) => {
        const data = await api.login(credentials);
        api.setToken(data.token);
        setUser(data.user);
        return data;
    };

    const register = async (userData) => {
        const data = await api.register(userData);
        api.setToken(data.token);
        setUser(data.user);
        return data;
    };

    const logout = () => {
        api.setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);