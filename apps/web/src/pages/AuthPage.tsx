import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { FieldError } from "@/components/ui/field-error";
import { AppLoadingScreen, BlockingLoadingOverlay } from "@/components/ui/AppLoadingScreen";

const SLUG_PATTERN = "[a-z0-9]+(?:-[a-z0-9]+)*";
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function slugFieldOk(value: string): boolean {
  return value.length >= 3 && value.length <= 32 && SLUG_RE.test(value);
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeSlashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

export function AuthPage() {
  const { login, register, loginWithGoogle, token, ready } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from ?? "/projects";

  const tab: "login" | "register" = loc.pathname === "/register" ? "register" : "login";
  const loadingMessage = tab === "login" ? "Đang đăng nhập…" : "Đang xử lý đăng ký…";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loginPwVisible, setLoginPwVisible] = useState(false);
  const [regPwVisible, setRegPwVisible] = useState(false);

  const [username, setUsername] = useState("");
  const [publicSlug, setPublicSlug] = useState("");
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);

  const [err, setErr] = useState<string | null>(null);
  const [loginEmailErr, setLoginEmailErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleDidInitRef = useRef(false);
  const loginWithGoogleRef = useRef(loginWithGoogle);
  loginWithGoogleRef.current = loginWithGoogle;

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setErr(null);
      setLoginEmailErr(null);
      setLoading(true);
      try {
        await loginWithGoogleRef.current(credential);
        toast.success(tab === "register" ? "Đăng ký Google thành công." : "Đăng nhập Google thành công.");
        nav(from, { replace: true });
      } catch (e) {
        let msg = String(e);
        if (e instanceof ApiError) {
          const b = e.body as { message?: string; error?: string };
          if (b?.error === "google_not_configured") {
            msg =
              "API chưa thấy GOOGLE_CLIENT_ID. Thêm biến này vào .env ở gốc code/mock-api-data, trùng Client ID với web, rồi khởi động lại tiến trình API.";
            setErr(msg);
            toast.warning(msg);
          } else {
            msg = b?.message ?? e.message;
            setErr(msg);
            toast.error(msg);
          }
        } else {
          setErr(msg);
          toast.error(msg);
        }
      } finally {
        setLoading(false);
      }
    },
    [from, nav, tab, toast]
  );

  const mountGoogleButton = useCallback(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
    const host = googleBtnRef.current;
    if (!clientId || !host || !window.google?.accounts?.id) return;

    const g = window.google.accounts.id;
    if (!googleDidInitRef.current) {
      g.initialize({
        client_id: clientId,
        callback: (res) => void handleGoogleCredential(res.credential),
      });
      googleDidInitRef.current = true;
    }

    const applyRender = () => {
      if (!googleBtnRef.current || !window.google?.accounts?.id) return;
      const h = googleBtnRef.current;
      const w = Math.max(h.getBoundingClientRect().width, h.offsetWidth, 280);
      h.innerHTML = "";
      window.google.accounts.id.renderButton(h, {
        theme: "outline",
        size: "large",
        width: Math.floor(w),
        type: "standard",
        text: tab === "login" ? "signin_with" : "signup_with",
        locale: "vi",
      });
    };

    requestAnimationFrame(() => requestAnimationFrame(applyRender));
  }, [handleGoogleCredential, tab]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
    if (!clientId) return;

    let cancelled = false;
    let interval = 0;

    const tryMount = () => {
      if (cancelled) return false;
      if (!googleBtnRef.current || !window.google?.accounts?.id) return false;
      mountGoogleButton();
      return true;
    };

    if (tryMount()) {
      return () => {
        cancelled = true;
      };
    }

    interval = window.setInterval(() => {
      if (tryMount()) window.clearInterval(interval);
    }, 50);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [mountGoogleButton, tab]);

  function goTab(next: "login" | "register") {
    if (next !== tab) setPassword("");
    setErr(null);
    setLoginEmailErr(null);
    if (next === "register") setRegisterStep(1);
    nav(next === "login" ? "/login" : "/register", { replace: true, state: loc.state });
  }

  useEffect(() => {
    if (tab !== "register") setRegisterStep(1);
  }, [tab]);

  async function sendVerificationCode() {
    const em = email.trim();
    if (!EMAIL_RE.test(em)) {
      const m = "Nhập email hợp lệ để nhận mã xác thực.";
      setErr(m);
      toast.warning(m);
      return;
    }
    setErr(null);
    setSendingCode(true);
    try {
      await apiFetch("/v1/auth/register/send-code", {
        method: "POST",
        json: { email: em },
      });
      setCodeSent(true);
      toast.success("Đã gửi mã xác thực về email.");
    } catch (e) {
      if (e instanceof ApiError) {
        const b = e.body as { message?: string };
        const m = b?.message ?? e.message;
        setErr(m);
        toast.error(m);
      } else {
        const m = String(e);
        setErr(m);
        toast.error(m);
      }
    } finally {
      setSendingCode(false);
    }
  }

  function continueRegisterToDisplayStep() {
    setErr(null);
    const em = email.trim();
    if (!em) {
      const m = "Nhập email.";
      setErr(m);
      toast.warning(m);
      return;
    }
    if (!EMAIL_RE.test(em)) {
      const m = "Email không hợp lệ.";
      setErr(m);
      toast.warning(m);
      return;
    }
    if (!password || password.length < 8) {
      const m = "Mật khẩu tối thiểu 8 ký tự.";
      setErr(m);
      toast.warning(m);
      return;
    }
    if (!verificationCode.trim() || verificationCode.trim().length < 4) {
      const m = "Nhập mã xác thực từ email.";
      setErr(m);
      toast.warning(m);
      return;
    }
    setRegisterStep(2);
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoginEmailErr(null);
    const em = email.trim();
    if (!em) {
      const m = "Nhập email.";
      setLoginEmailErr(m);
      toast.warning(m);
      return;
    }
    if (!EMAIL_RE.test(em)) {
      const m = "Email không hợp lệ.";
      setLoginEmailErr(m);
      toast.warning(m);
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Đăng nhập thành công.");
      nav(from, { replace: true });
    } catch (e2) {
      if (e2 instanceof ApiError) {
        const b = e2.body as { message?: string };
        const m = b?.message ?? e2.message;
        setErr(m);
        toast.error(m);
      } else {
        const m = String(e2);
        setErr(m);
        toast.error(m);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleRegisterForm(e: React.FormEvent) {
    e.preventDefault();
    if (registerStep === 1) {
      continueRegisterToDisplayStep();
      return;
    }
    void submitRegister();
  }

  async function submitRegister() {
    if (!slugFieldOk(username) || !slugFieldOk(publicSlug)) {
      const m = "Kiểm tra tên hiển thị và đoạn URL (3–32 ký tự, đúng định dạng).";
      setErr(m);
      toast.warning(m);
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      await register(username, publicSlug, email, password, verificationCode.trim());
      toast.success("Tạo tài khoản thành công.");
      setRegisterStep(1);
      nav("/projects", { replace: true });
    } catch (e2) {
      if (e2 instanceof ApiError) {
        const b = e2.body as { message?: string };
        const m = b?.message ?? e2.message;
        setErr(m);
        toast.error(m);
      } else {
        const m = String(e2);
        setErr(m);
        toast.error(m);
      }
    } finally {
      setLoading(false);
    }
  }

  const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());
  const slugInvalid =
    tab === "register" && publicSlug.length > 0 && !slugFieldOk(publicSlug);
  const usernameInvalid = tab === "register" && username.length > 0 && !slugFieldOk(username);

  if (ready && token) {
    return <Navigate to={from} replace />;
  }

  if (!ready) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] w-full items-center justify-center bg-zinc-950">
        <AppLoadingScreen layout="compact" message="Đang tải phiên đăng nhập…" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] w-full overflow-hidden bg-zinc-950">
      {/* Nền tràn mép (navbar vẫn nằm ngoài Layout main) */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-900/40 via-zinc-950 to-zinc-950"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_110%_55%_at_50%_-15%,rgba(139,92,246,0.13),transparent_52%)]"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-[calc(100dvh-4rem)] w-full flex-col items-center justify-center px-4 py-10 sm:py-12">
        <div className="w-full max-w-[420px] px-2">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-600 shadow-[0_0_20px_rgba(139,92,246,0.35)]">
            <span className="text-lg font-extrabold tracking-tighter text-white">PM</span>
          </div>
          <h1 className="text-lg font-bold uppercase tracking-tight text-zinc-100">PaperMock</h1>
          <p className="mt-1 text-center text-base font-medium uppercase tracking-[0.2em] text-zinc-500">
            Mock API · dữ liệu giả thử nghiệm
          </p>
        </div>

        <div className="overflow-visible rounded-xl border border-zinc-700/20 bg-zinc-950/80 shadow-2xl shadow-black/50 backdrop-blur-sm">
          <div className="p-4 pb-0">
            <div className="flex gap-1 rounded-lg bg-zinc-900/90 p-1">
              <button
                type="button"
                onClick={() => goTab("login")}
                className={`flex-1 rounded-md py-1.5 text-base font-medium transition-all duration-200 ${
                  tab === "login"
                    ? "bg-zinc-950/90 text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => goTab("register")}
                className={`flex-1 rounded-md py-1.5 text-base font-medium transition-all duration-200 ${
                  tab === "register"
                    ? "bg-zinc-950/90 text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                Đăng ký
              </button>
            </div>
          </div>

          <div className="p-8 pt-6">
            {googleConfigured ? (
              <>
                <div
                  className={`relative z-0 mb-6 min-h-[48px] w-full [&_iframe]:!max-w-full ${loading ? "pointer-events-none opacity-60" : ""}`}
                >
                  <div className="rounded-xl border border-zinc-700/35 bg-zinc-900/45 p-3 shadow-lg shadow-black/25">
                    <p className="mb-2 text-center text-base font-semibold text-zinc-300">
                      {tab === "login" ? "Tiếp tục bằng Google" : "Đăng ký nhanh với Google"}
                    </p>
                    <div
                      ref={googleBtnRef}
                      className="flex min-h-[48px] w-full justify-center rounded-lg bg-zinc-950/40 p-1.5 [&>div]:!w-full"
                    />
                  </div>
                </div>
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-700/25" />
                  </div>
                  <div className="relative flex justify-center text-base font-bold uppercase tracking-widest text-zinc-500">
                    <span className="bg-zinc-950/80 px-3 text-zinc-500">Hoặc tiếp tục bằng email</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="mb-6 text-center text-base leading-relaxed text-red-500">
                Thêm <code className="font-mono text-red-400">VITE_GOOGLE_CLIENT_ID</code> (web) và{" "}
                <code className="font-mono text-red-400">GOOGLE_CLIENT_ID</code> (API) trong{" "}
                <code className="font-mono text-red-400">code/mock-api-data/.env</code>, rồi khởi động lại Vite và API.
              </p>
            )}

            {tab === "login" ? (
              <form noValidate onSubmit={onLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="auth-email" className="block text-base font-bold uppercase tracking-wider text-zinc-500">
                    Địa chỉ email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setLoginEmailErr(null);
                      setErr(null);
                    }}
                    placeholder="dev@company.com"
                    aria-invalid={Boolean(tab === "login" && (loginEmailErr || err))}
                    aria-describedby={
                      tab === "login" && (loginEmailErr || err) ? "auth-login-email-err" : undefined
                    }
                    className="w-full rounded-lg border border-zinc-600/20 bg-zinc-900/30 px-3 py-2 text-base text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
                  />
                  <FieldError
                    id="auth-login-email-err"
                    message={tab === "login" ? loginEmailErr || err : null}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="auth-password" className="block text-base font-bold uppercase tracking-wider text-zinc-500">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={loginPwVisible ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErr(null);
                      }}
                      placeholder="••••••••"
                      aria-invalid={Boolean(tab === "login" && err && !loginEmailErr)}
                      aria-describedby={
                        tab === "login" && err && !loginEmailErr ? "auth-login-email-err" : undefined
                      }
                      className="w-full rounded-lg border border-zinc-600/20 bg-zinc-900/30 py-2 pl-3 pr-10 text-base text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
                    />
                    <button
                      type="button"
                      aria-label={loginPwVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      onClick={() => setLoginPwVisible((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                    >
                      {loginPwVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      className="text-base font-medium text-violet-400/90 hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-8 w-full rounded-lg bg-violet-600 py-2.5 text-base font-semibold text-white shadow-lg shadow-violet-600/15 transition-all hover:bg-violet-500 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? "…" : "Đăng nhập"}
                </button>
              </form>
            ) : (
              <form noValidate onSubmit={handleRegisterForm} className="space-y-4">
                <p className="text-center text-base font-medium uppercase tracking-wider text-zinc-500">
                  Đăng ký — bước {registerStep}/2
                </p>
                {registerStep === 1 ? (
                  <>
                    <div className="space-y-1.5">
                      <label htmlFor="reg-email" className="block text-base font-bold uppercase tracking-wider text-zinc-500">
                        Email
                      </label>
                      <input
                        id="reg-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setCodeSent(false);
                        }}
                        aria-invalid={Boolean(registerStep === 1 && err)}
                        aria-describedby={registerStep === 1 && err ? "auth-register-step1-err" : undefined}
                        className="w-full rounded-lg border border-zinc-600/20 bg-zinc-900/30 px-3 py-2 text-base text-zinc-100 outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <label htmlFor="reg-code" className="block text-base font-bold uppercase tracking-wider text-zinc-500">
                          Mã xác thực email
                        </label>
                        <button
                          type="button"
                          onClick={() => void sendVerificationCode()}
                          disabled={sendingCode}
                          className="rounded-lg border border-violet-500/45 bg-violet-500/10 px-3 py-1.5 text-base font-semibold text-violet-300 hover:bg-violet-500/20 disabled:opacity-50"
                        >
                          {sendingCode ? "Đang gửi..." : codeSent ? "Gửi lại mã" : "Gửi mã"}
                        </button>
                      </div>
                      <input
                        id="reg-code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\s+/g, ""))}
                        placeholder="Nhập mã 6 số"
                        aria-invalid={Boolean(registerStep === 1 && err)}
                        aria-describedby={registerStep === 1 && err ? "auth-register-step1-err" : undefined}
                        className="w-full rounded-lg border border-zinc-600/20 bg-zinc-900/30 px-3 py-2 font-mono text-base tracking-[0.2em] text-zinc-100 outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
                      />
                      <p className="text-base text-zinc-500">
                        {codeSent ? "Mã đã được gửi. Kiểm tra hộp thư đến (và Spam)." : "Bấm Gửi mã để nhận code qua Gmail."}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="reg-password" className="block text-base font-bold uppercase tracking-wider text-zinc-500">
                        Mật khẩu
                      </label>
                      <div className="relative">
                        <input
                          id="reg-password"
                          type={regPwVisible ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          minLength={8}
                          maxLength={128}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Tối thiểu 8 ký tự"
                          aria-invalid={Boolean(registerStep === 1 && err)}
                          aria-describedby={registerStep === 1 && err ? "auth-register-step1-err" : undefined}
                          className="w-full rounded-lg border border-zinc-600/20 bg-zinc-900/30 py-2 pl-3 pr-10 text-base text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
                        />
                        <button
                          type="button"
                          aria-label={regPwVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          onClick={() => setRegPwVisible((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                        >
                          {regPwVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <FieldError message={registerStep === 1 ? err : null} id="auth-register-step1-err" />
                    <button
                      type="button"
                      disabled={loading}
                      onClick={continueRegisterToDisplayStep}
                      className="mt-2 w-full rounded-lg bg-violet-600 py-2.5 text-base font-semibold text-white shadow-lg shadow-violet-600/15 transition-all hover:bg-violet-500 active:scale-[0.98] disabled:opacity-50"
                    >
                      Tiếp tục — chọn tên hiển thị
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-base leading-relaxed text-zinc-400">
                      Chọn <strong className="font-medium text-zinc-200">tên hiển thị</strong> và đoạn URL công khai — bước này hoàn tất trước khi tài khoản được tạo và bạn vào PaperMock.
                    </p>
                    <div className="space-y-1.5">
                      <label htmlFor="reg-username" className="block text-base font-bold uppercase tracking-wider text-zinc-500">
                        Tên hiển thị
                      </label>
                      <input
                        id="reg-username"
                        required
                        minLength={3}
                        maxLength={32}
                        pattern={SLUG_PATTERN}
                        title="Chữ thường, số, gạch ngang; không bắt đầu/kết thúc bằng gạch"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        placeholder="huynamboz"
                        className={`w-full rounded-lg border bg-zinc-900/30 px-3 py-2 font-mono text-base text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:ring-1 ${
                          usernameInvalid
                            ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/25"
                            : "border-zinc-600/20 focus:border-violet-500 focus:ring-violet-500/40"
                        }`}
                      />
                      <p className="text-base leading-snug text-zinc-500">
                        Hiển thị trong ứng dụng (menu, trang project). Cùng quy tắc kỹ thuật với tên tài khoản: chữ thường, số, gạch ngang.
                      </p>
                      <FieldError
                        size="compact"
                        className="text-base"
                        message={
                          usernameInvalid
                            ? "Tên hiển thị: 3–32 ký tự, chữ thường, số, gạch ngang (không đầu/cuối bằng gạch)."
                            : null
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="reg-slug" className="block text-base font-bold uppercase tracking-wider text-zinc-500">
                        Tên trong URL (hiển thị công khai)
                      </label>
                      <input
                        id="reg-slug"
                        required
                        minLength={3}
                        maxLength={32}
                        pattern={SLUG_PATTERN}
                        title="Chữ thường, số, gạch ngang; 3–32 ký tự"
                        value={publicSlug}
                        onChange={(e) => setPublicSlug(e.target.value.toLowerCase())}
                        placeholder="acme-team"
                        className={`w-full rounded-lg border bg-zinc-900/30 px-3 py-2 font-mono text-base text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:ring-1 ${
                          slugInvalid ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/25" : "border-zinc-600/20 focus:border-violet-500 focus:ring-violet-500/40"
                        }`}
                      />
                      <FieldError
                        size="compact"
                        className="text-base"
                        message={
                          slugInvalid
                            ? "Đoạn URL: 3–32 ký tự, chữ thường, số, gạch ngang (không đầu/cuối bằng gạch)."
                            : null
                        }
                      />
                      <div className="rounded border border-zinc-700/15 bg-black/25 p-2">
                        <code className="font-mono text-base text-zinc-500">
                          /api/
                          <span
                            className={
                              slugInvalid ? "text-red-400" : publicSlug ? "text-violet-400" : "text-zinc-600"
                            }
                          >
                            {publicSlug || "ten-trong-url"}
                          </span>
                          /…
                        </code>
                      </div>
                    </div>
                    <FieldError message={registerStep === 2 ? err : null} id="auth-register-step2-err" />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          setErr(null);
                          setRegisterStep(1);
                        }}
                        className="w-full rounded-lg border border-zinc-600/30 py-2.5 text-base font-semibold text-zinc-200 transition-colors hover:bg-zinc-800/40 sm:order-1 sm:w-auto sm:min-w-[7rem]"
                      >
                        Quay lại
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-violet-600 py-2.5 text-base font-semibold text-white shadow-lg shadow-violet-600/15 transition-all hover:bg-violet-500 active:scale-[0.98] disabled:opacity-50 sm:order-2 sm:flex-1"
                      >
                        {loading ? "…" : "Tạo tài khoản"}
                      </button>
                    </div>
                  </>
                )}
                <p className="mt-4 text-center text-base leading-relaxed text-zinc-500">
                  Khi tạo tài khoản, bạn đồng ý với{" "}
                  <Link to="/docs" className="text-zinc-400 underline hover:text-zinc-200">
                    hướng dẫn sử dụng
                  </Link>{" "}
                  và chính sách của dịch vụ.
                </p>
              </form>
            )}
          </div>
        </div>

        <footer className="mt-12 flex flex-col items-center justify-between gap-3 px-2 text-base font-medium uppercase tracking-widest text-zinc-600 sm:flex-row">
          <p>© {new Date().getFullYear()} PaperMock</p>
          <div className="flex gap-4">
            <Link to="/docs" className="hover:text-zinc-400">
              Docs
            </Link>
            <a href="mailto:support@example.com" className="hover:text-zinc-400">
              Hỗ trợ
            </a>
          </div>
        </footer>
        </div>
      </div>
      <BlockingLoadingOverlay open={loading} message={loadingMessage} />
    </div>
  );
}
