import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { FieldError } from "@/components/ui/field-error";

export type NewProjectPayload = {
  name: string;
  description: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: NewProjectPayload) => Promise<void>;
};

export function NewProjectDialog({ open, onOpenChange, onCreate }: Props) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setNameError(null);
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Nhập tên project.");
      return;
    }
    setNameError(null);
    setSubmitting(true);
    try {
      await onCreate({ name: trimmed, description: description.trim() });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/65"
        aria-label="Đóng"
        onClick={() => !submitting && onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-black/50"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight text-zinc-100">
            New project
          </h2>
          <button
            type="button"
            onClick={() => !submitting && onOpenChange(false)}
            className="rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Đóng hộp thoại"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="new-project-name" className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Project name
            </label>
            <input
              id="new-project-name"
              required
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="E.g. E-commerce App"
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "new-project-name-err" : undefined}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none ring-violet-500/0 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
            />
            <FieldError id="new-project-name-err" message={nameError} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="new-project-desc" className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Description
            </label>
            <textarea
              id="new-project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn (chỉ hiển thị trong UI; API hiện chưa lưu trường này)"
              rows={3}
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none ring-violet-500/0 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 disabled:opacity-50"
            >
              {submitting ? "Đang tạo…" : "Tạo project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
