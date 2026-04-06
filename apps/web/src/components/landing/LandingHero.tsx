import { Link } from "react-router-dom";
import { dm } from "@/lib/ui/dm-ui";
import { LandingVisualTool } from "@/components/landing/LandingVisualTool";

export function LandingHero() {
  const scrollToGuest = () => {
    document.getElementById("guest-generator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="px-4 pb-10 pt-16 sm:px-6 sm:pt-20 md:pt-28">
      <div className={dm.container + " text-center"}>
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800/80 bg-zinc-900/40 px-4 py-2 mb-6">
          <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" aria-hidden />
          <span className="text-[0.6875rem] uppercase tracking-widest font-semibold text-zinc-300">
            Bản phát hành v2.0 sẵn sàng để test
          </span>
        </div>

        <h1 className="mx-auto text-balance text-4xl font-extrabold tracking-tighter text-zinc-50 sm:text-5xl md:text-6xl lg:text-[3.35rem] lg:leading-tight max-w-4xl">
          API Mocking cho <span className="text-violet-400">Frontend Devs</span>. Realistic Data, Zero Backend.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-zinc-400 sm:text-xl">
          Tạo API endpoints giả lập chân thực, bao gồm cả dữ liệu lỗi (edge cases), độ trễ mạng và mô phỏng tải cao chỉ trong vài giây.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button type="button" onClick={scrollToGuest} className={dm.btn.primary}>
            Bắt đầu ngay (Miễn phí)
          </button>
          <Link to="/docs" className={dm.btn.outline}>
            Hướng dẫn sử dụng
          </Link>
        </div>
      </div>

      <div className={dm.container}>
        <LandingVisualTool />
      </div>
    </section>
  );
}
