import type { ReactNode } from "react";
import { AlertTriangle, BookOpenText, FolderTree, Layers, WifiOff } from "lucide-react";
import { dm } from "@/lib/ui/dm-ui";

export function LandingFeatures() {
  return (
    <section className="bg-zinc-900/30 border-t border-zinc-800/60 px-4 py-24 sm:px-6">
      <div className={dm.container}>
        <div className="mb-12 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-50">
            Mạnh mẽ. Linh hoạt. Đầy đủ.
          </h2>
          <p className="mt-3 font-sans text-base leading-relaxed text-zinc-300 md:text-lg">
            Mock APIs như production: dữ liệu thực tế, lỗi có chủ đích, và hành vi mạng giúp UI/Mobile chịu đựng tốt hơn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bento lớn */}
          <div className="md:col-span-2 relative rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-8 overflow-hidden h-64 group">
            <div className="absolute right-0 top-0 w-2/3 h-full opacity-10 bg-gradient-to-tr from-violet-500/30 to-rose-500/30 blur-2xl transition duration-500 group-hover:opacity-20" />
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  <FolderTree className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-zinc-50">Project & Resource Management</h3>
                <p className="mt-2 max-w-xs font-sans text-base leading-relaxed text-zinc-300 md:text-base">
                  Tổ chức mock theo dự án + endpoint riêng, để team FE/QAs quản lý dễ và rõ ràng.
                </p>
              </div>
              <div className="mt-6 flex gap-2 font-sans text-base text-zinc-400 sm:text-base">
                <span className="rounded-md border border-zinc-800 bg-zinc-950/30 px-2 py-1">CORS ready</span>
                <span className="rounded-md border border-zinc-800 bg-zinc-950/30 px-2 py-1">Method allowlist</span>
                <span className="rounded-md border border-zinc-800 bg-zinc-950/30 px-2 py-1">Version-safe</span>
              </div>
            </div>
          </div>

          <BentoCard
            icon={<AlertTriangle className="h-5 w-5" strokeWidth={2} aria-hidden />}
            title="Mô phỏng lỗi dữ liệu"
            desc="Cố tình gây lỗi dữ liệu: omit/null/mảng rỗng/text dị — để UI không sập khi gặp edge."
          />
          <BentoCard
            icon={<WifiOff className="h-5 w-5" strokeWidth={2} aria-hidden />}
            title="Mô phỏng lỗi mạng"
            desc="Giả lập latency và mã HTTP ngẫu nhiên — test loading, retry và thông báo lỗi."
          />
          <BentoCard
            icon={<Layers className="h-5 w-5" strokeWidth={2} aria-hidden />}
            title="Virtual Pagination"
            desc="Giả lập danh sách lớn: meta count thật, data sinh on-the-fly để infinite scroll mượt."
          />
          <BentoCard
            icon={<BookOpenText className="h-5 w-5" strokeWidth={2} aria-hidden />}
            title="Template Response"
            desc="Bọc body theo các template quen thuộc (JSON API-like, ok/result, custom $body)."
          />
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-8 h-64 relative overflow-hidden">
      <div className="flex flex-col h-full justify-between">
        <div>
          <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/20">
            {icon}
          </span>
          <h3 className="mt-4 text-lg font-bold text-zinc-50">{title}</h3>
          <p className="mt-2 font-sans text-base leading-relaxed text-zinc-300 md:text-base">{desc}</p>
        </div>
        <div className="text-base text-zinc-500">•</div>
      </div>
    </div>
  );
}
