# DevMock — code

Monorepo **pnpm**: `apps/api` (Fastify + Postgres), `apps/web` (Vite + React), `packages/shared` (Zod DSL).

**Hướng dẫn chạy & build (tiếng Việt, đầy đủ):** xem [`HUONG_DAN_CHAY_VA_BUILD.md`](./HUONG_DAN_CHAY_VA_BUILD.md).

---

## Tài liệu chạy local

### 1. Yêu cầu môi trường

| Thứ cần | Ghi chú |
|---------|---------|
| **Node.js** | 20 trở lên (`node -v`) |
| **pnpm 9** | `corepack enable && corepack prepare pnpm@9.15.0 --activate` hoặc `npm i -g pnpm` |
| **Neon (Postgres)** | Tài khoản miễn phí; tạo project và copy connection string |

Không cần Docker cho luồng dev mặc định.

### 2. Lấy code và cài dependency

```bash
cd <thư-mục-gốc-monorepo>   # ví dụ: code/mock-api-data
pnpm install
```

Nếu CI/Render báo lockfile lệch: trên máy bạn luôn chạy `pnpm install` sau khi pull, rồi commit `pnpm-lock.yaml` nếu có thay đổi.

### 3. Biến môi trường (`.env`)

Tạo file **`.env`** tại **gốc monorepo** (cùng cấp với `package.json` có script `dev` / `build`):

```bash
cp .env.example .env
```

Chỉnh nội dung — **không** commit `.env`.

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `DATABASE_URL` | Có (API) | Chuỗi Postgres Neon, dạng `postgresql://…?sslmode=require` |
| `JWT_SECRET` | **Có trên production** | Chuỗi dài ngẫu nhiên để ký JWT; local có thể bỏ qua (API dùng default + cảnh báo log) |
| `PORT` | Không | API lắng nghe; mặc định **3000** |
| `VITE_API_ORIGIN` | Không | Chỉ cho **web**: nếu set, trình duyệt gọi thẳng URL này (ví dụ API trên Render). **Để trống** khi dev cùng máy với API + dùng proxy Vite. |
| `VITE_DEV_API_PROXY` | Không | Mặc định `http://127.0.0.1:3000` — target proxy của Vite cho `/health`, `/api`, `/v1`. Đổi nếu API chạy port khác. |
| `VITE_GOOGLE_CLIENT_ID` | Không | Đăng nhập Google trên web (GIS). Trùng app OAuth với `GOOGLE_CLIENT_ID` phía API. |

`drizzle-kit` và API đều đọc `.env` ở gốc monorepo (và fallback `apps/api/.env` nếu có). Vite cũng load `VITE_*` từ cùng file `.env` đó.

### 4. Khởi tạo database (một lần / sau khi đổi schema)

Từ thư mục **gốc monorepo**:

```bash
pnpm db:push    # đẩy schema lên Neon (sau khi thêm cột auth: email, password_hash — chạy lại push)
pnpm db:seed    # user demo + endpoint /api/demo/v1/users
```

- **`db:push`**: cần `DATABASE_URL` đúng; nếu lỗi SSL thử bỏ `&channel_binding=require` khỏi URL (tùy driver).
- **`db:seed`**: chạy lại vẫn an toàn — nếu user `demo` đã có sẽ bỏ qua.

### 5. Chạy hằng ngày (API + Web)

Cần **hai terminal**, cùng thư mục gốc monorepo.

**Terminal A — API**

```bash
pnpm dev
```

- Log hiển thị port (thường **3000**).
- Kiểm tra: [http://127.0.0.1:3000/health](http://127.0.0.1:3000/health)  
- Mock demo: [http://127.0.0.1:3000/api/demo/v1/users?limit=3&page=1](http://127.0.0.1:3000/api/demo/v1/users?limit=3&page=1)

**Terminal B — Web**

```bash
pnpm dev:web
```

- UI: [http://localhost:5173](http://localhost:5173)
- Trang **Tổng quan** gọi `/health` và mock qua **proxy** → API terminal A (không cần CORS tách origin).

**Script gợi ý**

| Lệnh | Ý nghĩa |
|------|---------|
| `pnpm dev` | Build `shared` + chạy API (watch) |
| `pnpm dev:web` | Chỉ Vite (web) |
| `pnpm dev:api` | Giống `pnpm dev` (tên rõ ràng) |

### 6. Hai kiểu gọi API từ web local

1. **Proxy (mặc định)** — `VITE_API_ORIGIN` để trống: trình duyệt gọi `http://localhost:5173/health` → Vite chuyển tiếp sang API (theo `VITE_DEV_API_PROXY`).
2. **URL tuyệt đối** — set `VITE_API_ORIGIN=https://…onrender.com`: web gọi thẳng API deploy (API local có thể tắt). Hữu ích khi chỉ test FE.

Sau khi sửa `.env`, **restart** `pnpm dev:web`.

### 7. Build & chạy giống production (API)

```bash
pnpm build          # shared + api → apps/api/dist
PORT=3000 pnpm start
# hoặc: node apps/api/dist/index.js (từ apps/api sau khi build)
```

Web static:

```bash
pnpm build:web      # → apps/web/dist
pnpm --filter @devmock/web preview   # xem thử bản build (Vite preview)
```

### 8. Xử lý sự cố thường gặp

| Hiện tượng | Hướng xử lý |
|------------|-------------|
| `DATABASE_URL is not set` khi `db:push` | Đặt `.env` ở gốc monorepo, kiểm tra tên biến và không có space quanh `=`. |
| Web “Ping /health” lỗi | API có đang chạy không? Port 3000 có trùng app khác không? Thử đổi `PORT` + `VITE_DEV_API_PROXY`. |
| Giao diện báo **ETIMEDOUT** / timeout | **Local:** API (`pnpm dev`) chưa chạy hoặc sai port; **đừng** set `VITE_API_ORIGIN` khi dùng proxy. **Render:** service Free đang sleep — mở `https://…/health` trên trình duyệt, đợi cold start 1–2 phút rồi thử lại. |
| `pnpm install` trên Render lệch lockfile | Commit `pnpm-lock.yaml` sau `pnpm install` local. |
| Build API: không tìm thấy `@devmock/shared` / `packages/shared/dist` | Luôn `pnpm build` từ root (shared trước api). Không commit `*.tsbuildinfo`. |

---

## Deploy nhanh (tham chiếu)

- **API (Render)**: build `pnpm install && pnpm run build`, start `pnpm start`, env `DATABASE_URL`, `PORT` tự inject.
- **Web**: `pnpm build:web`, host thư mục `apps/web/dist` (Static Site).

Chi tiết Neon + Render: [`../prod/infra/01-neon-render.md`](../prod/infra/01-neon-render.md).

---

## Ghi chú Render (lỗi build trước đây)

- Shim `apps/api/src/deps/shared.ts` + **không** commit `*.tsbuildinfo` — xem `.gitignore`. Nếu đã commit nhầm: `git rm -f **/*.tsbuildinfo` rồi push.
