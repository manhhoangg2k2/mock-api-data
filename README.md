# DevMock — code

## Yêu cầu

- Node 20+
- [pnpm](https://pnpm.io) 9+
- File **`.env`** (không commit) với `DATABASE_URL` từ Neon. Có thể đặt ở **`code/.env`** hoặc **`code/apps/api/.env`** (cả hai đều được nạp).

```bash
cp .env.example .env
# chỉnh DATABASE_URL — không dấu ngoặc kép thừa, không space quanh =
```

## Lần đầu

```bash
cd code
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

- Health: `GET http://localhost:3000/health`
- Mock demo: `GET http://localhost:3000/api/demo/v1/users?page=1&limit=5`

## Production build

```bash
pnpm build
pnpm start
```

`PORT` do platform inject (Render).
