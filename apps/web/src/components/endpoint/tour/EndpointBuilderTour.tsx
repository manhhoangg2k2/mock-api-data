import { useCallback, useEffect, useState } from "react";
import { TOUR_STORAGE_KEY } from "../constants";

const STEPS = [
  {
    title: "Luồng nhanh",
    body: "Điền path → chọn dạng body → chỉnh fields. Preview bên phải tự cập nhật.",
  },
  {
    title: "Dạng response",
    body: "Object / mảng / phân trang ảo: chọn preset phù hợp API thật bạn đang giả lập.",
  },
  {
    title: "Fields & Chaos",
    body: "Mỗi field có kiểu + Faker. Mở Chaos chỉ khi cần test omit, null hoặc giá trị edge.",
  },
  {
    title: "Preview",
    body: "Bật Stress chaos để dễ thấy lỗi ngẫu nhiên. Icon ? cạnh tiêu đề mở giải thích chi tiết.",
  },
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
};

export function EndpointBuilderTour({ open, onClose }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setStep(0);
    onClose();
  }, [onClose]);

  const skip = useCallback(() => {
    finish();
  }, [finish]);

  if (!open) return null;

  const s = STEPS[step]!;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-raised p-6 shadow-2xl">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          Bước {step + 1} / {STEPS.length}
        </p>
        <h2 id="tour-title" className="mt-1 text-lg font-semibold text-white">
          {s.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{s.body}</p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={skip}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            Bỏ qua
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((i) => i - 1)}
                className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-slate-300 hover:bg-surface"
              >
                Trước
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((i) => i + 1)}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-surface hover:bg-sky-300"
              >
                Tiếp
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-surface hover:bg-sky-300"
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
