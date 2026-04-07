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
  getRefreshToken,
  getStoredUser,
  getToken,
  isAccessTokenUsable,
  SESSION_EXPIRED_EVENT,
  setSession,
  tryRefreshSession,
  type AuthUser,
} from "@/lib/api";
import { markEndpointTourPendingAfterAuth } from "@/lib/endpoint-tour-session";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    publicSlug: string,
    email: string,
    password: string,
    verificationCode: string
  ) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let nextToken: string | null = getToken();
      const rt = getRefreshToken();
      let nextUser: AuthUser | null = getStoredUser();

      if (!(nextToken && isAccessTokenUsable(nextToken))) {
        if (rt) {
          const ok = await tryRefreshSession();
          if (cancelled) return;
          if (ok) {
            nextToken = getToken();
            nextUser = getStoredUser();
          } else {
            nextToken = null;
            nextUser = null;
          }
        } else if (nextToken) {
          clearSession();
          nextToken = null;
          nextUser = null;
        }
      }

      if (!cancelled) {
        setToken(nextToken);
        setUser(nextUser);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
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
      localStorage.setItem("PaperMock_user", JSON.stringify(res.user));
    } catch {
      logout();
    }
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ token: string; refreshToken?: string; user: AuthUser }>("/v1/auth/login", {
      method: "POST",
      json: { email, password },
    });
    setSession(res.token, res.user, res.refreshToken);
    setToken(res.token);
    setUser(res.user);
    markEndpointTourPendingAfterAuth();
  }, []);

  const register = useCallback(
    async (
      username: string,
      publicSlug: string,
      email: string,
      password: string,
      verificationCode: string
    ) => {
      const res = await apiFetch<{ token: string; refreshToken?: string; user: AuthUser }>("/v1/auth/register", {
        method: "POST",
        json: { username, publicSlug, email, password, verificationCode },
      });
      setSession(res.token, res.user, res.refreshToken);
      setToken(res.token);
      setUser(res.user);
      markEndpointTourPendingAfterAuth();
    },
    []
  );

  const loginWithGoogle = useCallback(async (credential: string) => {
    const res = await apiFetch<{ token: string; refreshToken?: string; user: AuthUser }>("/v1/auth/google", {
      method: "POST",
      json: { credential },
    });
    setSession(res.token, res.user, res.refreshToken);
    setToken(res.token);
    setUser(res.user);
    markEndpointTourPendingAfterAuth();
  }, []);

  const value = useMemo(
    () => ({ user, token, ready, login, register, loginWithGoogle, logout, refreshMe }),
    [user, token, ready, login, register, loginWithGoogle, logout, refreshMe]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
