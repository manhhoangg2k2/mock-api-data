import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiFetch,
  clearSession,
  getStoredUser,
  getToken,
  setSession,
  type AuthUser,
} from "@/lib/api";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = getToken();
    const u = getStoredUser();
    setToken(t);
    setUser(u);
    setReady(true);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!getToken()) return;
    try {
      const res = await apiFetch<{ user: AuthUser }>("/v1/auth/me");
      setUser(res.user);
      localStorage.setItem("devmock_user", JSON.stringify(res.user));
    } catch {
      logout();
    }
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: AuthUser }>("/v1/auth/login", {
      method: "POST",
      json: { email, password },
    });
    setSession(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: AuthUser }>("/v1/auth/register", {
      method: "POST",
      json: { username, email, password },
    });
    setSession(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const value = useMemo(
    () => ({ user, token, ready, login, register, logout, refreshMe }),
    [user, token, ready, login, register, logout, refreshMe]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
