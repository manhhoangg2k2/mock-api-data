import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { dm } from "@/lib/ui/dm-ui";

function Li({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" strokeWidth={2.5} aria-hidden />
      <span>{children}</span>
    </li>
  );
}

export function LandingPricing() {
  return (
    <section
      id="pricing"
      className="scroll-mt-24 bg-zinc-900/20 border-t border-zinc-800/60 px-4 py-24 sm:px-6"
    >
      <div className={dm.container}>
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold text-zinc-50">Bắt đầu đơn giản, mở rộng vô hạn.</h2>
          <p className="mt-3 text-zinc-400 text-sm md:text-base">
            Guest để test ngay. Personal để lưu project và mock lâu dài. Pro (coming soon) cho team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Guest */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-8 flex flex-col">
            <span className="text-[0.6875rem] uppercase tracking-widest font-bold text-zinc-400 mb-4">
              Guest
            </span>
            <div className="text-3xl font-extrabold text-zinc-50 mb-6">Free</div>
            <ul className="space-y-4 flex-1 text-sm text-zinc-400">
              <Li>Không cần đăng nhập — tạo mock công khai.</Li>
              <Li>
                TTL ngắn (ví dụ <span className="font-medium text-zinc-200">30 phút</span>) phù hợp test nhanh.
              </Li>
              <Li>Giới hạn tạo theo thiết bị &amp; IP.</Li>
            </ul>
            <button
              type="button"
              onClick={() =>
                document.getElementById("guest-generator")?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="mt-8 border border-zinc-800/70 rounded-lg text-sm font-semibold text-zinc-200 py-3 hover:bg-zinc-800/40 transition-colors"
            >
              Dùng thử ngay
            </button>
          </div>

          {/* Personal */}
          <div className="bg-zinc-900/40 border border-violet-500/30 rounded-xl p-8 pt-16 flex flex-col relative shadow-2xl shadow-violet-500/10">
            <div className="absolute top-5 right-6 rounded-full bg-violet-500 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-tighter text-white">
              Phổ biến nhất
            </div>
            <span className="text-[0.6875rem] uppercase tracking-widest font-bold text-violet-300 mb-4">
              Personal
            </span>
            <div className="text-3xl font-extrabold text-zinc-50 mb-6">
              $0 <span className="text-xs font-normal text-zinc-500">Forever</span>
            </div>
            <ul className="space-y-4 flex-1 text-sm text-zinc-400">
              <Li>Quản lý Project &amp; nhiều endpoint.</Li>
              <Li>Mock lưu vĩnh viễn theo tài khoản.</Li>
              <Li>Toàn quyền mô phỏng lỗi (đúng mục tiêu test resilience).</Li>
            </ul>
            <Link to="/register" className={dm.btn.primary + " mt-8 inline-flex w-full items-center justify-center text-center"}>
              Đăng ký miễn phí
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-xl p-8 flex flex-col opacity-70 grayscale">
            <span className="text-[0.6875rem] uppercase tracking-widest font-bold text-zinc-400 mb-4">Pro</span>
            <div className="text-3xl font-extrabold text-zinc-50 mb-6">Coming soon</div>
            <ul className="space-y-4 flex-1 text-sm text-zinc-400">
              <Li>Team collaboration</Li>
              <Li>Custom domains</Li>
              <Li>Enterprise SLA</Li>
            </ul>
            <button
              type="button"
              disabled
              className="mt-8 w-full rounded-lg bg-violet-500/20 text-zinc-400 py-3 text-sm font-semibold cursor-not-allowed"
            >
              Đăng ký sớm
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
