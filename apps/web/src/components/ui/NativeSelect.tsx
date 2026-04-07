import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { MenuSelect } from "./select-menu";

const CHEVRON_ZINC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E";

const CHEVRON_BASE =
  "appearance-none bg-[length:1rem_1rem] bg-[position:right_0.65rem_center] bg-no-repeat pr-10";

const UI_CLASS = {
  zinc: `${CHEVRON_BASE} w-full min-h-10 rounded-xl border border-zinc-800 bg-zinc-950 pl-3 py-2 text-base text-zinc-200 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50`,
  zincCompact: `${CHEVRON_BASE} mt-2 min-h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900/60 pl-3 py-2 text-base text-zinc-200 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-auto`,
  surface: `${CHEVRON_BASE} w-full min-h-10 rounded-xl border border-zinc-800 bg-zinc-950 pl-3 py-2.5 text-base text-zinc-100 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/35 disabled:cursor-not-allowed disabled:opacity-50`,
  surfaceRaised: `${CHEVRON_BASE} w-full min-h-10 rounded-xl border border-zinc-800 bg-zinc-900 pl-3 py-2 text-base text-zinc-100 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/35 disabled:cursor-not-allowed disabled:opacity-50`,
} as const;

export type NativeSelectUI = keyof typeof UI_CLASS;

export type NativeSelectProps = ComponentPropsWithoutRef<"select"> & {
  ui?: NativeSelectUI;
};

export const NativeSelect = forwardRef<HTMLButtonElement, NativeSelectProps>(function NativeSelect(
  props,
  ref
) {
  const { ui = "zinc", className = "", style, children, ...r } = props;
  return (
    <MenuSelect
      ref={ref}
      id={r.id}
      value={r.value === undefined ? undefined : String(r.value)}
      defaultValue={r.defaultValue === undefined ? undefined : String(r.defaultValue)}
      disabled={r.disabled}
      required={r.required}
      name={r.name}
      form={r.form}
      autoFocus={r.autoFocus}
      aria-label={r["aria-label"]}
      aria-labelledby={r["aria-labelledby"]}
      onChange={r.onChange}
      triggerClassName={`${UI_CLASS[ui]} ${className}`.trim()}
      chevronDataUrl={CHEVRON_ZINC}
      style={style}
    >
      {children}
    </MenuSelect>
  );
});
