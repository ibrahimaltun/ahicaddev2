"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    getCurrentUser,
    logout as logoutRequest,
    refreshSession,
} from "../api";

import type { User } from "../types";

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    refreshUser: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(
    undefined,
);

export function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const currentUser = await getCurrentUser();

            setUser(currentUser);
        } catch {
            // Erisim tokeni dolduysa sessizce yenilemeyi dene (30 dk'lik
            // erisim tokeni sonrasi zor cikis engellenir).
            try {
                const session = await refreshSession();

                setUser(session.user);
            } catch {
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!cancelled) {
                await refreshUser();
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [refreshUser]);

    const logout = useCallback(async () => {
        await logoutRequest();

        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated: user !== null,
                isAdmin: user?.role === "admin",
                refreshUser,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider",
        );
    }

    return context;
}