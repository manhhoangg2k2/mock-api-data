# Hướng dẫn chạy và build DevMock

Tài liệu này mô tả cách cài đặt, chạy môi trường phát triển và build bản production cho monorepo **DevMock** (`apps/api` + `apps/web` + `packages/shared`).

---

## 1. Yêu cầu môi trường

| Thành phần | Phiên bản / ghi chú |
|------------|---------------------|
| **Node.js** | 20 trở lên (`node -v`) |
| **pnpm** | 9.x (monorepo khai báo `packageManager: pnpm@9.15.0`) |
| **PostgreSQL** | Dùng [Neon](https://neon.tech) (miễn phí) hoặc Postgres bất kỳ có `DATABASE_URL` |

Cài pnpm (một trong các cách):

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

---

## 2. Thư mục làm việc và cài dependency

Thư mục gốc monorepo là nơi có file `package.json` chứa script `dev`, `build` (trong repo thường là `code/mock-api-data`).

```bash
cd <đường-dẫn-tới-thư-mục-monorepo>
pnpm install
```

Luôn chạy `pnpm install` sau khi `git pull` nếu có thay đổi dependency; commit kèm `pnpm-lock.yaml` khi lockfile đổi.

---

## 3. Biến môi trường

Tạo file **`.env`** ngay tại **thư mục gốc monorepo** (cùng cấp với `package.json` gốc):

```bash
cp .env.example .env
```

Chỉnh giá trị; **không** commit `.env`.

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `DATABASE_URL` | Có (API, Drizzle) | Chuỗi Postgres, ví dụ Neon: `postgresql://…?sslmode=require` |
| `PORT` | Không | API mặc định **3000** |
| `JWT_SECRET` | Bắt buộc trên production | Chuỗi dài ngẫu nhiên để ký JWT |
| `GOOGLE_CLIENT_ID` | Không | Server: xác thực Google (phải khớp client web) |
| `VITE_API_ORIGIN` | Không | Web: gọi thẳng URL API (deploy). **Để trống** khi dev dùng proxy Vite |
| `VITE_DEV_API_PROXY` | Không | Mặc định `http://127.0.0.1:3000` — target proxy cho `/api`, `/v1`, `/health` |
| `VITE_GOOGLE_CLIENT_ID` | Không | Web: đăng nhập Google (GIS); trùng loại ID với cấu hình Google Console |

Vite đọc `VITE_*` từ `.env` ở **gốc monorepo** (`envDir` trỏ lên `../..` từ `apps/web`). Sau khi sửa `.env`, restart `pnpm dev:web`.

---

## 4. Khởi tạo database (lần đầu hoặc sau khi đổi schema)

Từ thư mục gốc monorepo:

```bash
pnpm db:push    # đồng bộ schema lên Postgres
pnpm db:seed    # dữ liệu mẫu (user demo, endpoint demo — chạy lại an toàn)
```

Tuỳ chọn: `pnpm db:studio` — giao diện Drizzle Studio.

---

## 5. Chạy development

Cần **hai terminal**, cùng thư mục gốc monorepo.

**Terminal 1 — API** (build `shared` + chạy API watch):

```bash
pnpm dev
```

- Kiểm tra: `http://127.0.0.1:3000/health` (hoặc `PORT` bạn cấu hình).

**Terminal 2 — Web**:

```bash
pnpm dev:web
```

- UI: `http://localhost:5173`  
- Request tới `/api`, `/v1`, `/health` trên cổng 5173 được Vite proxy sang API (theo `VITE_DEV_API_PROXY`).

| Lệnh | Mục đích |
|------|----------|
| `pnpm dev` | Build `@devmock/shared` + chạy API dev |
| `pnpm dev:api` | Giống `pnpm dev` |
| `pnpm dev:web` | Chỉ frontend Vite |

---

## 6. Build production

### API (shared + compile TypeScript)

Từ thư mục gốc monorepo:

```bash
pnpm build
```

Kết quả: `packages/shared/dist`, `apps/api/dist`.

Chạy binary đã build:

```bash
pnpm start
```

(tương đương `node apps/api/dist/index.js` trong package API; đảm bảo đã `pnpm build` và có `DATABASE_URL`, v.v. trong môi trường chạy.)

Hoặc chỉ định port:

```bash
PORT=3000 pnpm start
```

### Web (TypeScript check + Vite build)

```bash
pnpm build:web
```

Output: `apps/web/dist` (file tĩnh). Xem thử cục bộ:

```bash
pnpm --filter @devmock/web preview
```

---

## 7. Bảng lệnh tóm tắt

| Lệnh | Mô tả |
|------|--------|
| `pnpm install` | Cài dependency toàn monorepo |
| `pnpm dev` | Dev API (+ build shared) |
| `pnpm dev:web` | Dev web |
| `pnpm build` | Production build: **shared + api** |
| `pnpm build:web` | Production build: **web** |
| `pnpm start` | Chạy API từ `apps/api/dist` |
| `pnpm db:push` | Push schema Drizzle |
| `pnpm db:seed` | Seed DB |
| `pnpm db:studio` | Drizzle Studio |

---

## 8. Xử lý sự cố thường gặp

| Hiện tượng | Hướng xử lý |
|------------|-------------|
| `DATABASE_URL is not set` | Kiểm tra `.env` ở **gốc monorepo**, không có khoảng trắng thừa quanh `=`. |
| Web không gọi được API | API có đang chạy? Port 3000 có bị chiếm? Đồng bộ `PORT` với `VITE_DEV_API_PROXY`. |
| Build API lỗi thiếu `@devmock/shared` | Luôn `pnpm build` từ root (build shared trước api). |
| Lockfile lệch trên CI | Chạy `pnpm install` local, commit `pnpm-lock.yaml`. |

---

## 9. Tài liệu liên quan

- `README.md` — bản tóm tắt + deploy nhanh  
- `prod/infra/` (nếu có trong repo) — Neon, Render, static hosting  
