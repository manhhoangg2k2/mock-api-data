export const fieldErrorTextClass = "text-rose-400";

type FieldErrorProps = {
  message?: string | null | false | undefined;
  id?: string;
  className?: string;
  size?: "default" | "compact";
  variant?: "plain" | "panel";
};

const sizeClass: Record<NonNullable<FieldErrorProps["size"]>, string> = {
  default: "mt-1.5 text-base leading-snug",
  compact: "mt-1 text-base leading-snug",
};

const variantClass: Record<NonNullable<FieldErrorProps["variant"]>, string> = {
  plain: "",
  panel: "rounded border border-rose-800/60 bg-rose-950/35 px-2 py-1",
};

export function FieldError({
  message,
  id,
  className = "",
  size = "default",
  variant = "plain",
}: FieldErrorProps) {
  const m = typeof message === "string" ? message.trim() : "";
  if (!m) return null;
  return (
    <p
      id={id}
      role="alert"
      className={[sizeClass[size], fieldErrorTextClass, variantClass[variant], className].filter(Boolean).join(" ")}
    >
      {m}
    </p>
  );
}
