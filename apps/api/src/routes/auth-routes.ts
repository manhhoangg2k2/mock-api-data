import { randomBytes } from "node:crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import type { FastifyInstance, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import nodemailer from "nodemailer";
import { z } from "zod";
import { db } from "../db/client.js";
import { emailVerificationCodes, users } from "../db/schema.js";
import { assertValidSlug } from "../util/slug.js";

const ACCESS_JWT_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN ?? process.env.JWT_EXPIRES_IN ?? "15m";
const REFRESH_JWT_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN ?? "30d";

async function issueAuthTokens(reply: FastifyReply, sub: string, username: string) {
  const token = await reply.jwtSign(
    { sub, username, typ: "access" },
    { expiresIn: ACCESS_JWT_EXPIRES }
  );
  const refreshToken = await reply.jwtSign({ sub, typ: "refresh" }, { expiresIn: REFRESH_JWT_EXPIRES });
  return { token, refreshToken };
}

const registerBody = z.object({
  username: z.string().min(3).max(32),
  /** Đoạn trong URL public mock: /api/<publicSlug>/… */
  publicSlug: z.string().min(3).max(32),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  verificationCode: z.string().min(4).max(8),
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

const sendRegisterCodeBody = z.object({
  email: z.string().email(),
});

function webhookToken(): string {
  return randomBytes(24).toString("hex");
}

function sixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const smtpHost = process.env.SMTP_HOST?.trim();
const smtpPort = Number(process.env.SMTP_PORT ?? "587");
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS?.trim();
const smtpSecure = String(process.env.SMTP_SECURE ?? "false").toLowerCase() === "true";
const mailFrom = process.env.MAIL_FROM?.trim() || smtpUser || "no-reply@papermock.local";

const mailer =
  smtpHost && smtpPort && smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPass },
      })
    : null;

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "23505";
}

function publicUser(row: {
  id: string;
  username: string;
  email: string | null;
  publicSlug: string | null;
}) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    publicSlug: row.publicSlug ?? row.username,
  };
}

async function allocateUsernameAndSlugFromEmail(emailNorm: string): Promise<{ username: string; publicSlug: string }> {
  const raw = emailNorm.split("@")[0]!.toLowerCase().replace(/[^a-z0-9-]/g, "") || "user";
  let base = raw.slice(0, 24);
  if (base.length < 3) base = `${base}usr`.slice(0, 32);
  for (let i = 0; i < 12; i++) {
    const suffix = i === 0 ? "" : randomBytes(2).toString("hex");
    const candidate = (base + suffix).slice(0, 32);
    try {
      assertValidSlug("username", candidate);
      return { username: candidate, publicSlug: candidate };
    } catch {
      /* try next */
    }
  }
  const fallback = `u${randomBytes(6).toString("hex")}`.slice(0, 32);
  assertValidSlug("username", fallback);
  return { username: fallback, publicSlug: fallback };
}

/** Khi attempt > 0: local phần random để tránh trùng username/slug với user khác cùng tên trước @. */
async function allocateUsernameAndSlugForGoogle(emailNorm: string, attempt: number): Promise<{ username: string; publicSlug: string }> {
  if (attempt === 0) return allocateUsernameAndSlugFromEmail(emailNorm);
  const noise = `${randomBytes(3).toString("hex")}${attempt}`;
  return allocateUsernameAndSlugFromEmail(`${noise}@newuser.local`);
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/v1/auth/register/send-code", async (request, reply) => {
    const parsed = sendRegisterCodeBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({ error: "validation_error", details: parsed.error.flatten() });
    }
    const emailNorm = parsed.data.email.trim().toLowerCase();

    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, emailNorm))
      .limit(1);
    if (existingUser[0]) {
      return reply.status(409).send({ error: "email_exists", message: "Email này đã có tài khoản." });
    }

    if (!mailer) {
      return reply.status(503).send({
        error: "email_not_configured",
        message: "Chưa cấu hình SMTP để gửi mã. Thiết lập SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/MAIL_FROM.",
      });
    }

    const [last] = await db
      .select({ createdAt: emailVerificationCodes.createdAt })
      .from(emailVerificationCodes)
      .where(eq(emailVerificationCodes.email, emailNorm))
      .orderBy(desc(emailVerificationCodes.createdAt))
      .limit(1);

    if (last?.createdAt && Date.now() - new Date(last.createdAt).getTime() < 60_000) {
      return reply.status(429).send({
        error: "too_many_requests",
        message: "Vui lòng chờ 60 giây trước khi gửi lại mã.",
      });
    }

    const code = sixDigitCode();
    const codeHash = await bcrypt.hash(code, 8);
    const expiresAt = new Date(Date.now() + 10 * 60_000);

    await db.insert(emailVerificationCodes).values({
      email: emailNorm,
      codeHash,
      expiresAt,
    });

    await mailer.sendMail({
      from: mailFrom,
      to: emailNorm,
      subject: "[PaperMock] Ma xac thuc dang ky",
      text: `Ma xac thuc cua ban la: ${code}\nMa co hieu luc trong 10 phut.`,
      html: `<p>Ma xac thuc cua ban la: <b style="font-size:20px;letter-spacing:2px">${code}</b></p><p>Ma co hieu luc trong 10 phut.</p>`,
    });

    return reply.send({
      ok: true,
      expiresInSec: 600,
      message: "Da gui ma xac thuc ve email.",
    });
  });

  app.post("/v1/auth/register", async (request, reply) => {
    const parsed = registerBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({ error: "validation_error", details: parsed.error.flatten() });
    }
    const { username, publicSlug, email, password, verificationCode } = parsed.data;
    try {
      assertValidSlug("username", username);
      assertValidSlug("publicSlug", publicSlug);
    } catch (e) {
      const err = e as Error;
      return reply.status(400).send({ error: "invalid_slug", message: err.message });
    }

    const emailNorm = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);

    const [codeRow] = await db
      .select()
      .from(emailVerificationCodes)
      .where(
        and(
          eq(emailVerificationCodes.email, emailNorm),
          isNull(emailVerificationCodes.consumedAt),
          gt(emailVerificationCodes.expiresAt, new Date())
        )
      )
      .orderBy(desc(emailVerificationCodes.createdAt))
      .limit(1);

    if (!codeRow) {
      return reply.status(400).send({
        error: "verification_required",
        message: "Bạn cần gửi mã xác thực email trước khi đăng ký.",
      });
    }

    const codeOk = await bcrypt.compare(verificationCode.trim(), codeRow.codeHash);
    if (!codeOk) {
      return reply.status(400).send({ error: "invalid_verification_code", message: "Mã xác thực không đúng." });
    }

    try {
      const [row] = await db
        .insert(users)
        .values({
          username,
          publicSlug,
          email: emailNorm,
          passwordHash,
          webhookToken: webhookToken(),
        })
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          publicSlug: users.publicSlug,
        });

      await db
        .update(emailVerificationCodes)
        .set({ consumedAt: new Date() })
        .where(eq(emailVerificationCodes.id, codeRow.id));

      const { token, refreshToken } = await issueAuthTokens(reply, row.id, row.username);
      return reply.status(201).send({
        token,
        refreshToken,
        user: publicUser(row),
      });
    } catch (e) {
      if (isUniqueViolation(e)) {
        return reply
          .status(409)
          .send({ error: "conflict", message: "Tên người dùng, đoạn URL công khai hoặc email đã tồn tại." });
      }
      throw e;
    }
  });

  app.post("/v1/auth/login", async (request, reply) => {
    const parsed = loginBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({ error: "validation_error", details: parsed.error.flatten() });
    }
    const { email, password } = parsed.data;
    const emailNorm = email.trim().toLowerCase();

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, emailNorm))
      .limit(1);
    const user = rows[0];
    if (!user?.passwordHash) {
      return reply.status(401).send({ error: "invalid_credentials", message: "Sai email hoặc mật khẩu." });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return reply.status(401).send({ error: "invalid_credentials", message: "Sai email hoặc mật khẩu." });
    }

    const { token, refreshToken } = await issueAuthTokens(reply, user.id, user.username);
    return reply.send({
      token,
      refreshToken,
      user: publicUser({
        id: user.id,
        username: user.username,
        email: user.email,
        publicSlug: user.publicSlug,
      }),
    });
  });

  const googleBody = z.object({
    credential: z.string().min(20),
  });

  app.post("/v1/auth/google", async (request, reply) => {
    const parsed = googleBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({ error: "validation_error", details: parsed.error.flatten() });
    }
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      return reply.status(503).send({
        error: "google_not_configured",
        message: "Chưa cấu hình GOOGLE_CLIENT_ID trên server.",
      });
    }

    const oauth = new OAuth2Client(clientId);
    let emailNorm: string;
    try {
      const ticket = await oauth.verifyIdToken({
        idToken: parsed.data.credential,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      const em = payload?.email?.trim().toLowerCase();
      if (!em) {
        return reply.status(400).send({ error: "no_email", message: "Google không trả về email." });
      }
      emailNorm = em;
    } catch {
      return reply.status(401).send({ error: "invalid_google_token", message: "Không xác thực được Google." });
    }

    const userFields = {
      id: users.id,
      username: users.username,
      email: users.email,
      publicSlug: users.publicSlug,
    };

    const existing = await db.select(userFields).from(users).where(eq(users.email, emailNorm)).limit(1);
    let urow = existing[0];

    if (!urow) {
      const maxAttempts = 15;
      for (let attempt = 0; attempt < maxAttempts && !urow; attempt++) {
        const { username, publicSlug } = await allocateUsernameAndSlugForGoogle(emailNorm, attempt);
        try {
          const [row] = await db
            .insert(users)
            .values({
              username,
              publicSlug,
              email: emailNorm,
              passwordHash: null,
              webhookToken: webhookToken(),
            })
            .returning(userFields);
          urow = row;
        } catch (e) {
          if (isUniqueViolation(e)) {
            const byEmail = await db.select(userFields).from(users).where(eq(users.email, emailNorm)).limit(1);
            if (byEmail[0]) {
              urow = byEmail[0];
              break;
            }
            /* Trùng username/public_slug với tài khoản email khác — thử bộ tên khác. */
          } else {
            request.log.error({ err: e }, "google_signup_insert_failed");
            throw e;
          }
        }
      }
    }

    if (!urow) {
      request.log.error("google_signup_exhausted_retries");
      return reply.status(500).send({ error: "user_create_failed", message: "Không tạo được tài khoản." });
    }
    const { token, refreshToken } = await issueAuthTokens(reply, urow.id, urow.username);
    return reply.send({ token, refreshToken, user: publicUser(urow) });
  });

  const refreshBody = z.object({
    refreshToken: z.string().min(20),
  });

  app.post("/v1/auth/refresh", async (request, reply) => {
    const parsed = refreshBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({ error: "validation_error", details: parsed.error.flatten() });
    }
    let sub: string;
    try {
      const decoded = app.jwt.verify(parsed.data.refreshToken) as { sub?: string; typ?: string };
      if (decoded.typ !== "refresh" || typeof decoded.sub !== "string") {
        return reply.status(401).send({
          error: "invalid_refresh",
          message: "Refresh token không hợp lệ.",
        });
      }
      sub = decoded.sub;
    } catch {
      return reply.status(401).send({
        error: "invalid_refresh",
        message: "Refresh token hết hạn hoặc không hợp lệ.",
      });
    }

    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        publicSlug: users.publicSlug,
      })
      .from(users)
      .where(eq(users.id, sub))
      .limit(1);
    const row = rows[0];
    if (!row) {
      return reply.status(401).send({
        error: "invalid_refresh",
        message: "Tài khoản không còn tồn tại.",
      });
    }

    const { token, refreshToken } = await issueAuthTokens(reply, row.id, row.username);
    return reply.send({
      token,
      refreshToken,
      user: publicUser(row),
    });
  });

  app.get("/v1/auth/me", { onRequest: [app.authenticate] }, async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        publicSlug: users.publicSlug,
      })
      .from(users)
      .where(eq(users.id, sub))
      .limit(1);
    const u = rows[0];
    if (!u) {
      return reply.status(404).send({ error: "not_found" });
    }
    return { user: publicUser(u) };
  });
}

