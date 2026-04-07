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
          <span className="text-base font-semibold uppercase tracking-wider text-zinc-200">
            Bản phát hành v1.0 đã lên production, sẵn sàng cho người dùng
          </span>
        </div>

        <h1 className="mx-auto max-w-4xl text-balance font-sans text-4xl font-extrabold tracking-tight text-zinc-50 sm:text-5xl md:text-6xl lg:text-6xl lg:leading-[1.12] xl:text-7xl">
          API Mocking cho <span className="text-violet-400">Frontend Devs</span>. Realistic Data, Zero Backend.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-pretty font-sans text-lg leading-relaxed text-zinc-300 sm:text-xl md:text-2xl">
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
