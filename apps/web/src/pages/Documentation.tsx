import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ExternalLink } from "lucide-react";
import { dm } from "@/lib/ui/dm-ui";

function Code({ children }: { children: string }) {
  return (
    <code className="block overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 font-mono text-xs leading-relaxed text-zinc-300">
      {children}
    </code>
  );
}

function VisualDemo({ title, children }: { title: string; children: ReactNode }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-950/20 to-zinc-900/40 p-4 sm:p-5">
      <figcaption className="mb-3 text-xs font-semibold uppercase tracking-wide text-violet-300/90">{title}</figcaption>
      {children}
    </figure>
  );
}

function Section({
  id,
  title,
  kicker,
  children,
}: {
  id: string;
  title: string;
  kicker?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-zinc-800/60 pt-12 first:border-t-0 first:pt-0">
      {kicker ? (
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-violet-400/90">{kicker}</p>
      ) : null}
      <h2 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-zinc-400">{children}</div>
    </section>
  );
}

function TocLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <a
      href={to}
      className="group flex items-start gap-1.5 rounded-md py-1 text-left text-sm text-zinc-400 transition hover:bg-zinc-800/50 hover:text-zinc-100"
    >
      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600 group-hover:text-violet-400" aria-hidden />
      <span>{children}</span>
    </a>
  );
}

const toc = [
  { href: "#gioi-thieu", label: "Giới thiệu" },
  {
    href: "#khong-dang-nhap",
    label: "Dùng không cần tài khoản (Guest)",
    sub: [
      { href: "#vao-dung-cho", label: "Vào đúng chỗ trên web" },
      { href: "#cac-buoc", label: "Các bước làm lần lượt" },
      { href: "#tung-o-nghia", label: "Từng ô trên form là gì?" },
      { href: "#vi-du-minh-hoa", label: "Ví dụ trực quan + URL" },
      { href: "#gioi-han", label: "Giới hạn & lưu ý" },
    ],
  },
  { href: "#dang-ky-khi-nao", label: "Khi nào nên đăng ký?" },
  { href: "#da-dang-nhap", label: "Đã đăng nhập: Projects & URL" },
  { href: "#developer", label: "Gợi ý cho developer" },
] as const;

export function Documentation() {
  return (
    <div className="mx-auto max-w-6xl pb-16">
      <div className="lg:grid lg:grid-cols-[minmax(0,15.5rem)_minmax(0,1fr)] lg:gap-12 lg:items-start">
        {/* Mục lục — sticky, nhảy nhanh tới từng phần */}
        <nav
          aria-label="Mục lục hướng dẫn"
          className="mb-10 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 lg:sticky lg:top-24 lg:mb-0"
        >
          <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-zinc-500">Trên trang này</p>
          <ul className="space-y-1">
            {toc.map((item) => (
              <li key={item.href}>
                <TocLink to={item.href}>{item.label}</TocLink>
                {"sub" in item && item.sub ? (
                  <ul className="ml-4 mt-1 space-y-0.5 border-l border-zinc-800 pl-3">
                    {item.sub.map((s) => (
                      <li key={s.href}>
                        <TocLink to={s.href}>{s.label}</TocLink>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-zinc-800 pt-4">
            <Link
              to={{ pathname: "/", hash: "guest-generator" }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 hover:underline"
            >
              Mở Guest trên trang chủ
              <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
            </Link>
          </div>
        </nav>

        <article className="min-w-0 space-y-0">
          <header id="gioi-thieu" className="scroll-mt-28 space-y-4 pb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">Tài liệu</p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">Hướng dẫn sử dụng DevMock</h1>
            <p className="max-w-2xl text-base text-zinc-400">
              Trang này giải thích cách dùng DevMock bằng tiếng Việt đơn giản. Phần{" "}
              <strong className="font-medium text-zinc-200">quan trọng nhất</strong> là hướng dẫn chi tiết cho người{" "}
              <strong className="font-medium text-zinc-200">chưa đăng nhập</strong> — tạo API giả (mock) công khai trong vài phút, không cần tài
              khoản.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to={{ pathname: "/", hash: "guest-generator" }} className={dm.btn.primary + " !px-4 !py-2 text-xs"}>
                Thử Guest ngay trên trang chủ
              </Link>
              <Link to="/register" className={dm.btn.outline + " !px-4 !py-2 text-xs"}>
                Đăng ký khi cần lưu lâu dài
              </Link>
            </div>
          </header>

          <Section id="khong-dang-nhap" kicker="Không cần đăng nhập" title="Guest API — làm thế nào từ đầu đến cuối?">
            <p>
              <strong className="text-zinc-200">Guest</strong> là chế độ “dùng thử”: bạn cấu hình dữ liệu giả trên web, bấm một nút để tạo URL công
              khai, rồi app / Postman / trình duyệt có thể gọi URL đó như API thật. Sau khoảng <strong className="text-zinc-200">30 phút</strong>, URL
              hết hạn (để tiết kiệm tài nguyên).
            </p>
          </Section>

          <Section id="vao-dung-cho" title="Bước 0 — Vào đúng chỗ trên web">
            <ol className="list-decimal space-y-2 pl-5 marker:text-zinc-500">
              <li>
                Mở{" "}
                <Link to="/" className="text-violet-400 hover:underline">
                  trang chủ
                </Link>
                .
              </li>
              <li>
                Kéo xuống tới khối tiêu đề kiểu <strong className="text-zinc-200">“Mô phỏng lỗi thực tế. Tạo API Mock công khai…”</strong> — đó là
                khu <strong className="text-zinc-200">Guest Generator</strong>. Hoặc bấm nút{" "}
                <strong className="text-zinc-200">“Bắt đầu ngay (Miễn phí)”</strong> ở phần đầu trang: trình duyệt sẽ cuộn thẳng xuống đây.
              </li>
              <li>
                Bạn sẽ thấy <strong className="text-zinc-200">hai cột</strong>: bên trái là form <strong className="text-zinc-200">Cấu hình Guest</strong>
                , bên phải là <strong className="text-zinc-200">Live preview</strong> (JSON mẫu thay đổi theo cấu hình).
              </li>
            </ol>

            <VisualDemo title="Minh họa bố cục (trái = cấu hình · phải = xem trước)">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <div className="flex-1 rounded-lg border border-dashed border-zinc-600 bg-zinc-950/60 p-3 text-center text-[11px] text-zinc-500">
                  <p className="mb-2 font-medium text-zinc-400">Cột trái</p>
                  <p className="font-mono text-violet-300/90">Resource path</p>
                  <p className="mt-1 text-zinc-600">Loại response · Quantity</p>
                  <p className="mt-1 text-zinc-600">Mô phỏng lỗi · Fields</p>
                  <p className="mt-3 rounded border border-violet-500/30 bg-violet-500/10 py-1.5 text-violet-200">Release API (công khai)</p>
                </div>
                <div className="hidden shrink-0 items-center justify-center text-zinc-600 sm:flex" aria-hidden>
                  →
                </div>
                <div className="flex-1 rounded-lg border border-dashed border-zinc-600 bg-zinc-950/60 p-3 text-center text-[11px] text-zinc-500">
                  <p className="mb-2 font-medium text-zinc-400">Cột phải</p>
                  <p className="font-mono text-emerald-400/90">Live preview</p>
                  <p className="mt-1 text-zinc-600">JSON mẫu · nút Reroll</p>
                  <p className="mt-3 rounded bg-zinc-900/80 p-2 text-left font-mono text-[10px] text-zinc-500">{"{ … }"}</p>
                </div>
              </div>
            </VisualDemo>
          </Section>

          <Section id="cac-buoc" title="Các bước làm lần lượt (từ trên xuống dưới form)">
            <ol className="list-decimal space-y-4 pl-5 marker:font-semibold marker:text-violet-400">
              <li>
                <strong className="text-zinc-200">Điền Resource path</strong> — đường dẫn “giả” của API, <strong className="text-zinc-200">không</strong>{" "}
                gõ <code className="rounded bg-zinc-900 px-1 font-mono text-zinc-300">/</code> ở đầu. Ví dụ: <code className="font-mono text-zinc-300">v1/users</code>.
                <p className="mt-2 text-xs text-zinc-500">
                  Dưới ô nhập có dòng gợi ý dạng <code className="font-mono text-zinc-400">/api/guest/&lt;token&gt;/…</code> — sau khi bạn release,{" "}
                  <code className="font-mono text-zinc-400">&lt;token&gt;</code> là mã ngẫu nhiên; phần sau cùng chính là path bạn nhập.
                </p>
              </li>
              <li>
                <strong className="text-zinc-200">Chọn Loại response</strong> — một object đơn, danh sách, hoặc kiểu có phân trang (tùy mục đích demo). Đọc
                mô tả nhỏ ngay dưới ô chọn.
              </li>
              <li>
                <strong className="text-zinc-200">Quantity</strong> — chỉ có ý nghĩa khi response là danh sách / nhiều bản ghi (khi ô không bị mờ đi).
                Tối đa <strong className="text-zinc-200">10</strong> bản ghi trong chế độ Guest.
              </li>
              <li>
                <strong className="text-zinc-200">Mô phỏng lỗi</strong> (bật/tắt): khi bật, bạn chọn <strong className="text-zinc-200">một</strong> kiểu
                lỗi (ví dụ thiếu trường trong JSON, hoặc ép giá trị <code className="font-mono text-zinc-400">null</code>) để frontend/backend bạn có dữ
                liệu “lệch” để test. Khi tắt, preview ổn định hơn.
              </li>
              <li>
                <strong className="text-zinc-200">Fields</strong> — mỗi dòng là một thuộc tính trong JSON trả về: <strong className="text-zinc-200">Key</strong>{" "}
                (tên trong JSON), <strong className="text-zinc-200">Type</strong> (chuỗi, số, email…), <strong className="text-zinc-200">Faker</strong> (gợi ý
                cách sinh dữ liệu đẹp). Tối đa <strong className="text-zinc-200">10</strong> field. Bấm <strong className="text-zinc-200">Thêm field</strong>{" "}
                nếu cần.
              </li>
              <li>
                Xem <strong className="text-zinc-200">Live preview</strong> bên phải; có thể bấm <strong className="text-zinc-200">Reroll</strong> để đổi bộ
                giá trị mẫu ngẫu nhiên (vẫn đúng kiểu dữ liệu bạn chọn).
              </li>
              <li>
                Khi ổn, bấm <strong className="text-zinc-200">Release API (công khai)</strong>. Nếu còn quota trong giờ, hệ thống tạo URL và hiện ở khối
                dưới preview (và có thể copy).
              </li>
            </ol>
          </Section>

          <Section id="tung-o-nghia" title="Tóm tắt nhanh: từng ô nghĩa là gì?">
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-3 py-2 font-medium">Phần trên màn hình</th>
                    <th className="px-3 py-2 font-medium">Việc bạn cần biết</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-400">
                  <tr className="border-b border-zinc-800/80">
                    <td className="px-3 py-2.5 font-medium text-zinc-300">Resource path</td>
                    <td className="px-3 py-2.5">
                      Đuôi URL sau <code className="font-mono text-zinc-400">/api/guest/&lt;token&gt;/</code>. Không gõ <code className="font-mono">/</code>{" "}
                      đầu dòng.
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-800/80">
                    <td className="px-3 py-2.5 font-medium text-zinc-300">Loại response</td>
                    <td className="px-3 py-2.5">Hình dạng JSON trả về (một object, mảng, paginated…).</td>
                  </tr>
                  <tr className="border-b border-zinc-800/80">
                    <td className="px-3 py-2.5 font-medium text-zinc-300">Quantity</td>
                    <td className="px-3 py-2.5">Số phần tử (guest ≤ 10) khi response là danh sách / nhiều bản ghi.</td>
                  </tr>
                  <tr className="border-b border-zinc-800/80">
                    <td className="px-3 py-2.5 font-medium text-zinc-300">Mô phỏng lỗi</td>
                    <td className="px-3 py-2.5">Bật để đôi khi trả về JSON “lỗi” có chủ đích; guest chỉ chọn được một kiểu.</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2.5 font-medium text-zinc-300">Fields</td>
                    <td className="px-3 py-2.5">Các key trong JSON + kiểu + gợi ý faker (guest ≤ 10 field).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="vi-du-minh-hoa" title="Ví dụ trực quan: URL trông như thế nào?">
            <p>
              Sau khi release thành công, bạn nhận URL dạng (đây chỉ là <strong className="text-zinc-200">mẫu</strong>, token thật sẽ dài và khác mỗi lần):
            </p>
            <Code>{`GET https://<máy-chủ-của-bạn>/api/guest/abc123xyz.../v1/users`}</Code>
            <p className="text-xs text-zinc-500">
              Thay <code className="font-mono text-zinc-400">&lt;máy-chủ-của-bạn&gt;</code> bằng domain hoặc localhost + cổng API mà tài liệu triển khai của
              bạn quy định (ví dụ chạy local thường là cổng API <code className="font-mono text-zinc-400">3000</code>).
            </p>

            <VisualDemo title="Minh họa: path trong form → đoạn cuối URL">
              <div className="space-y-3 font-mono text-xs">
                <div className="rounded-lg bg-zinc-950 px-3 py-2 text-zinc-400">
                  <span className="text-zinc-600">Bạn gõ Resource path:</span>{" "}
                  <span className="text-violet-300">v1/users</span>
                </div>
                <div className="rounded-lg bg-zinc-950 px-3 py-2 text-zinc-400">
                  <span className="text-zinc-600">URL đầy đủ (mẫu):</span>
                  <br />
                  <span className="break-all text-emerald-300/90">
                    …/api/guest/<span className="text-amber-200/90">[token]</span>/v1/users
                  </span>
                </div>
              </div>
            </VisualDemo>

            <p>
              Bạn có thể dán URL vào trình duyệt (nếu API cho phép GET) hoặc dùng curl / Postman. Dòng chữ <strong className="text-zinc-200">“Còn X/Y lượt…”</strong>{" "}
              dưới nút Release cho biết trong một giờ bạn còn bao nhiêu lần tạo guest mới.
            </p>
          </Section>

          <Section id="gioi-han" title="Giới hạn khi chưa đăng nhập — nhớ kỹ để khỏi bất ngờ">
            <ul className="list-disc space-y-2 pl-5 marker:text-amber-400/80">
              <li>
                API guest <strong className="text-zinc-200">~30 phút</strong> là hết hạn — không dùng cho production dài hạn.
              </li>
              <li>
                Tối đa <strong className="text-zinc-200">10 fields</strong>, <strong className="text-zinc-200">10 records</strong> / cấu hình (theo giới hạn
                hiển thị trên trang).
              </li>
              <li>
                <strong className="text-zinc-200">Một kiểu</strong> mô phỏng lỗi tại một thời điểm.
              </li>
              <li>
                Số lần bấm Release trong <strong className="text-zinc-200">một giờ</strong> bị giới hạn (quota) — thấy rõ trên giao diện.
              </li>
            </ul>
          </Section>

          <Section id="dang-ky-khi-nao" kicker="Bước tiếp theo" title="Khi nào nên đăng ký tài khoản?">
            <p>
              Khi bạn cần mock <strong className="text-zinc-200">lưu lâu dài</strong>, nhiều project / endpoint, hoặc URL dạng ổn định{" "}
              <code className="rounded bg-zinc-900 px-1 font-mono text-zinc-300">/api/&lt;tên-tài-khoản&gt;/…</code> (không phụ thuộc token guest ngắn
              hạn), hãy{" "}
              <Link to="/register" className="text-violet-400 hover:underline">
                đăng ký
              </Link>{" "}
              hoặc{" "}
              <Link to="/login" className="text-violet-400 hover:underline">
                đăng nhập
              </Link>
              . Free tier có giới hạn số project / endpoint (xem trên trang{" "}
              <Link to="/projects" className="text-violet-400 hover:underline">
                Projects
              </Link>{" "}
              sau khi vào app).
            </p>
          </Section>

          <Section id="da-dang-nhap" kicker="Đã đăng nhập" title="Projects: tạo mock lưu trong tài khoản">
            <p>
              Sau đăng nhập, mở{" "}
              <Link to="/projects" className="text-violet-400 hover:underline">
                Projects
              </Link>{" "}
              → tạo project → trong project tạo / sửa endpoint (path, method, field schema, v.v.). URL công khai kiểu:
            </p>
            <Code>{`GET https://<host>/api/<username-hoặc-public-slug>/<resource-path>`}</Code>
            <p className="text-xs text-zinc-500">
              Chi tiết field trong form builder có thêm tour hướng dẫn trên giao diện chỉnh endpoint.
            </p>
          </Section>

          <Section id="developer" kicker="Developer" title="Gợi ý thêm khi tích hợp / chạy local">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Phản hồi mock có thể kèm header kiểu <code className="font-mono text-zinc-400">X-DevMock-Chaos</code> để biết trường nào bị lệch so với
                “đường vui” — hữu ích khi debug.
              </li>
              <li>
                API thường chạy cổng <code className="font-mono text-zinc-400">3000</code>, web Vite <code className="font-mono text-zinc-400">5173</code>. Khi chưa
                cấu hình <code className="font-mono text-zinc-400">VITE_API_ORIGIN</code>, web dev có thể proxy tới API — xem file{" "}
                <code className="font-mono text-zinc-400">.env</code> và README trong repo.
              </li>
            </ul>
          </Section>

          <div className="mt-14 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5">
            <p className="text-sm text-zinc-400">
              Quay lại thử Guest trên trang chủ?{" "}
              <Link to={{ pathname: "/", hash: "guest-generator" }} className={dm.btn.outline + " ml-2 inline-flex items-center gap-1 !py-2 !px-4 text-xs"}>
                Mở Guest Generator
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
