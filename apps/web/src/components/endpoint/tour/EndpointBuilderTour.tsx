import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { TOUR_STORAGE_KEY } from "../constants";
import { markEndpointTourFinished } from "@/lib/endpoint-tour-session";

export const ENDPOINT_BUILDER_TOUR_STEP_COUNT = 7;

const STEPS = [
  {
    target: "path-methods",
    title: "Đường dẫn & method",
    body: "Điền path tương đối (không có / đầu) và chọn ít nhất một HTTP method được phép trên mock.",
  },
  {
    target: "response-body",
    title: "Dạng response",
    body: "Object đơn, mảng, hoặc phân trang ảo — chọn preset gần với API thật bạn đang giả lập. Với Paginated, page size, total và trang mặc định cùng một hàng: trang mặc định là trang mock khi không có ?page= trong query (gửi ?page= thì ghi đè).",
  },
  {
    target: "response-layout",
    title: "Locale & khung JSON trả về",
    body: "Faker locale quyết định ngôn ngữ/vùng cho dữ liệu giả (tên, địa chỉ…). “Layout JSON trả về” bọc payload sinh được: raw, { success, body }, kiểu JSON:API, hoặc custom có chuỗi $body.",
  },
  {
    target: "fields-schema",
    title: "Trường dữ liệu (schema)",
    body: "Mỗi dòng: Key (tên trong JSON), Kiểu (string, number, email…) quyết định kiểu giá trị, và Faker (tùy chọn) để sinh dữ liệu mẫu giống thật — ví dụ email → generator email, uuid → chuỗi UUID. Để trống Faker thì dùng giá trị mặc định theo kiểu.",
  },
  {
    target: "field-variants",
    title: "Mô phỏng lỗi từng trường",
    body: "Mở khối “Mô phỏng lỗi dữ liệu”: Bỏ trường = thiếu key trong JSON; Null = giá trị null; Giá trị xấu = một giá trị “hỏng” theo mẫu bạn chọn (email sai, số âm…). Ba thanh không vượt quá 100% tổng; phần còn lại là dữ liệu chuẩn từ Faker.",
  },
  {
    target: "preview-panel",
    title: "Live preview",
    body: "Xem JSON sau khi bọc layout. Các dòng tô đỏ là đúng chỗ giá trị lệch (null, giá trị xấu, thiếu key nếu path resolve được) — mỗi bản ghi chỉ tô những trường thực sự bị đổi, không tô cả cột trùng tên.",
  },
  {
    target: "advanced-section",
    title: "Nâng cao (Latency & Roulette)",
    body: "Latency min/max: độ trễ ngẫu nhiên giữa mỗi lần gọi mock. Status roulette: thỉnh thoảng trả HTTP status khác (404, 500…) theo tỷ lệ — hữu ích để test retry và xử lý lỗi trên client.",
  },
] as const;

const TOUR_SCROLL_LOCK_CLASS = "tour-scroll-lock";

type SpotlightRect = { top: number; left: number; width: number; height: number };

function measureElementSpotlight(el: HTMLElement, pad = 10): SpotlightRect {
  const r = el.getBoundingClientRect();
  const top = Math.max(0, r.top - pad);
  const left = Math.max(0, r.left - pad);
  const right = r.right + pad;
  const bottom = r.bottom + pad;
  return {
    top,
    left,
    width: Math.max(right - left, 48),
    height: Math.max(bottom - top, 48),
  };
}

function computeTourCardPos(
  spotlight: SpotlightRect | null,
  vw: number,
  vh: number,
  margin = 16,
  ch = 260
): { top: number; left: number } {
  const cw = Math.min(380, vw - margin * 2);
  if (!spotlight) {
    return {
      top: Math.max(margin, (vh - ch) / 2),
      left: Math.max(margin, (vw - cw) / 2),
    };
  }
  const sb = spotlight.top + spotlight.height;
  let top = sb + 14;
  let left = spotlight.left + (spotlight.width - cw) / 2;
  left = Math.min(Math.max(margin, left), vw - cw - margin);
  if (top + ch > vh - margin) {
    top = spotlight.top - ch - 14;
  }
  if (top < margin) top = margin;
  return { top, left };
}

function TourDimmer({ rect }: { rect: SpotlightRect | null }) {
  if (!rect) {
    return (
      <div
        className="tour-backdrop-animate fixed inset-0 z-[190] bg-black/75 backdrop-blur-[2px]"
        aria-hidden
      />
    );
  }
  const t = rect.top;
  const l = rect.left;
  const r = rect.left + rect.width;
  const b = rect.top + rect.height;
  const dim = "tour-backdrop-animate fixed z-[190] bg-black/75 backdrop-blur-[2px]";
  return (
    <>
      <div className={dim} style={{ top: 0, left: 0, right: 0, height: t }} />
      <div className={dim} style={{ top: b, left: 0, right: 0, bottom: 0 }} />
      <div className={dim} style={{ top: t, left: 0, width: l, height: b - t }} />
      <div className={dim} style={{ top: t, left: r, right: 0, height: b - t }} />
    </>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  onStepChange?: (stepIndex: number) => void;
};

export function EndpointBuilderTour({ open, onClose, onStepChange }: Props) {
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useEffect(() => {
    if (open) onStepChange?.(step);
  }, [open, step, onStepChange]);

  const targetSelector = open ? STEPS[step]?.target : null;

  const applyPlacementFromElement = useCallback((el: HTMLElement | null) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (!el) {
      setSpotlight(null);
      setCardPos(computeTourCardPos(null, vw, vh));
      return;
    }
    const sp = measureElementSpotlight(el);
    setSpotlight(sp);
    setCardPos(computeTourCardPos(sp, vw, vh));
  }, []);

  const measureSpotlight = useCallback(() => {
    if (!open || !targetSelector) {
      applyPlacementFromElement(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${targetSelector}"]`);
    if (!(el instanceof HTMLElement)) {
      applyPlacementFromElement(null);
      return;
    }
    applyPlacementFromElement(el);
  }, [open, targetSelector, applyPlacementFromElement]);

  useLayoutEffect(() => {
    if (!open) {
      applyPlacementFromElement(null);
      return;
    }
    const sel = STEPS[step]?.target;
    if (!sel) {
      applyPlacementFromElement(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${sel}"]`);
    if (!(el instanceof HTMLElement)) {
      applyPlacementFromElement(null);
      return;
    }
    el.scrollIntoView({ behavior: "instant", block: "center", inline: "nearest" });
    applyPlacementFromElement(el);
  }, [open, step, applyPlacementFromElement]);

  useLayoutEffect(() => {
    if (!open) {
      document.documentElement.classList.remove(TOUR_SCROLL_LOCK_CLASS);
      return;
    }
    document.documentElement.classList.add(TOUR_SCROLL_LOCK_CLASS);
    return () => {
      document.documentElement.classList.remove(TOUR_SCROLL_LOCK_CLASS);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => measureSpotlight();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, measureSpotlight]);

  useEffect(() => {
    if (!open || !targetSelector) return;
    const el = document.querySelector(`[data-tour="${targetSelector}"]`);
    if (!el || !(el instanceof HTMLElement)) return;
    const ro = new ResizeObserver(() => measureSpotlight());
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, targetSelector, measureSpotlight]);

  const finish = useCallback(() => {
    markEndpointTourFinished();
    setStep(0);
    setSpotlight(null);
    onClose();
  }, [onClose]);

  const skip = useCallback(() => {
    finish();
  }, [finish]);

  if (!open) return null;

  const s = STEPS[step]!;

  return (
    <div
      className="fixed inset-0 z-[200]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
    >
      <TourDimmer rect={spotlight} />

      {spotlight ? (
        <div
          className="tour-spotlight-ring pointer-events-none fixed z-[195] rounded-xl border-2 border-violet-400 bg-transparent"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
          aria-hidden
        />
      ) : null}

      <div
        key={step}
        className="tour-card-animate fixed z-[210] w-[min(380px,calc(100vw-32px))] rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl shadow-black/60 ring-1 ring-violet-500/20"
        style={{ top: cardPos.top, left: cardPos.left }}
      >
        <p className="text-base font-medium uppercase tracking-wider text-violet-400/90">
          Bước {step + 1} / {STEPS.length}
        </p>
        <h2 id="tour-title" className="mt-1 text-lg font-semibold tracking-tight text-zinc-50">
          {s.title}
        </h2>
        <p className="mt-3 max-h-[min(40vh,280px)] overflow-y-auto text-base leading-relaxed text-zinc-400">
          {s.body}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={skip}
            className="text-base text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Bỏ qua
          </button>
          <div className="flex gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((i) => i - 1)}
                className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-1.5 text-base font-medium text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800"
              >
                Trước
              </button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((i) => i + 1)}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-base font-medium text-white shadow-md shadow-violet-900/40 transition-colors hover:bg-violet-500"
              >
                Tiếp tục
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-base font-medium text-white shadow-md shadow-violet-900/40 transition-colors hover:bg-violet-500"
              >
                Bắt đầu
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function hasCompletedTour(): boolean {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}
