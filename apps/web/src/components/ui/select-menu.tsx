import {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type ParsedSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  title?: string;
  groupLabel?: string;
};

function nodeToText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return nodeToText(node.props.children);
  return "";
}

export function parseSelectChildren(children: ReactNode): ParsedSelectOption[] {
  const out: ParsedSelectOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === "optgroup") {
      const glabel = String((child.props as { label?: string }).label ?? "");
      Children.forEach((child.props as { children?: ReactNode }).children, (opt) => {
        if (!isValidElement(opt) || opt.type !== "option") return;
        const p = opt.props as { value?: string; disabled?: boolean; title?: string; children?: ReactNode };
        out.push({
          value: String(p.value ?? ""),
          label: nodeToText(p.children),
          disabled: Boolean(p.disabled),
          title: typeof p.title === "string" ? p.title : undefined,
          groupLabel: glabel,
        });
      });
    } else if (child.type === "option") {
      const p = child.props as { value?: string; disabled?: boolean; title?: string; children?: ReactNode };
      out.push({
        value: String(p.value ?? ""),
        label: nodeToText(p.children),
        disabled: Boolean(p.disabled),
        title: typeof p.title === "string" ? p.title : undefined,
      });
    }
  });
  return out;
}

type MenuSelectProps = {
  id?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  form?: string;
  autoFocus?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  triggerClassName: string;
  chevronDataUrl: string;
};

function emitChange(onChange: MenuSelectProps["onChange"], value: string) {
  if (!onChange) return;
  const t = { value } as HTMLSelectElement;
  onChange({ target: t, currentTarget: t } as ChangeEvent<HTMLSelectElement>);
}

const LIST_MAX_PX = 240; // tương đương max-h-60
const VIEWPORT_PAD = 8;

type PopoverCoords =
  | { left: number; width: number; maxHeight: number; top: number }
  | { left: number; width: number; maxHeight: number; bottom: number };

function measureFromButton(btn: HTMLElement): PopoverCoords {
  const r = btn.getBoundingClientRect();
  const gap = 4;
  const spaceBelow = window.innerHeight - r.bottom - gap - VIEWPORT_PAD;
  const spaceAbove = r.top - gap - VIEWPORT_PAD;
  const minOpen = 100;
  const preferBelow =
    spaceBelow >= minOpen || (spaceBelow >= spaceAbove && spaceBelow >= 48);

  const width = Math.max(r.width, 120);
  let left = r.left;
  if (left + width > window.innerWidth - VIEWPORT_PAD) {
    left = Math.max(VIEWPORT_PAD, window.innerWidth - VIEWPORT_PAD - width);
  }
  left = Math.max(VIEWPORT_PAD, left);

  if (preferBelow) {
    const maxHeight = Math.min(LIST_MAX_PX, Math.max(72, spaceBelow));
    return { left, width, top: r.bottom + gap, maxHeight };
  }
  const maxHeight = Math.min(LIST_MAX_PX, Math.max(72, spaceAbove));
  return {
    left,
    width,
    bottom: window.innerHeight - r.top + gap,
    maxHeight,
  };
}

export const MenuSelect = forwardRef<HTMLButtonElement, MenuSelectProps>(function MenuSelect(props, ref) {
  const {
    id: idProp,
    value: valueControlled,
    defaultValue,
    disabled,
    required,
    name,
    form,
    autoFocus,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    className = "",
    style,
    children,
    onChange,
    triggerClassName,
    chevronDataUrl,
  } = props;
  const reactId = useId();
  const listboxId = `${reactId}-listbox`;
  const options = useMemo(() => parseSelectChildren(children), [children]);

  const isControlled = valueControlled !== undefined;
  const [uncontrolled, setUncontrolled] = useState(() => defaultValue ?? options[0]?.value ?? "");
  const value = isControlled ? String(valueControlled ?? "") : uncontrolled;

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [popover, setPopover] = useState<PopoverCoords | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  function setBtnRef(el: HTMLButtonElement | null) {
    btnRef.current = el;
    if (ref == null) return;
    if (typeof ref === "function") ref(el);
    else ref.current = el;
  }

  const selectedIdx = useMemo(() => {
    const i = options.findIndex((o) => o.value === value);
    return i >= 0 ? i : 0;
  }, [options, value]);

  const displayLabel = options.find((o) => o.value === value)?.label ?? (value || "—");

  useEffect(() => {
    if (!open) return;
    setHighlight(selectedIdx);
  }, [open, selectedIdx]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const syncPopoverPosition = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    setPopover(measureFromButton(btn));
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPopover(null);
      return;
    }
    syncPopoverPosition();
    window.addEventListener("resize", syncPopoverPosition);
    window.addEventListener("scroll", syncPopoverPosition, true);
    return () => {
      window.removeEventListener("resize", syncPopoverPosition);
      window.removeEventListener("scroll", syncPopoverPosition, true);
    };
  }, [open, syncPopoverPosition]);

  useEffect(() => {
    if (!open || !popover || !listRef.current) return;
    const row = listRef.current.querySelector<HTMLElement>(`[data-idx="${highlight}"]`);
    row?.scrollIntoView({ block: "nearest" });
  }, [open, popover, highlight]);

  useEffect(() => {
    if (!open || !popover) return;
    const t = window.setTimeout(() => listRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open, popover]);

  const selectIndex = useCallback(
    (idx: number) => {
      const o = options[idx];
      if (!o || o.disabled) return;
      if (!isControlled) setUncontrolled(o.value);
      emitChange(onChange, o.value);
      setOpen(false);
      btnRef.current?.focus();
    },
    [options, onChange, isControlled]
  );

  const onBtnKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlight(selectedIdx);
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        selectIndex(highlight);
      }
    }
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      let n = highlight + 1;
      while (n < options.length && options[n]?.disabled) n++;
      if (n < options.length) setHighlight(n);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      let n = highlight - 1;
      while (n >= 0 && options[n]?.disabled) n--;
      if (n >= 0) setHighlight(n);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      selectIndex(highlight);
    }
  };

  return (
    <div className={`relative ${className}`.trim()} style={style}>
      {name ? (
        <input type="hidden" name={name} form={form} value={value} readOnly aria-hidden />
      ) : null}
      <button
        ref={setBtnRef}
        type="button"
        id={idProp}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-required={required}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        className={`${triggerClassName} flex min-w-0 w-full items-center`.trim()}
        style={{ backgroundImage: `url("${chevronDataUrl}")` }}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onBtnKeyDown}
      >
        <span className="min-w-0 flex-1 truncate text-left">{displayLabel}</span>
      </button>

      {open && popover
        ? createPortal(
            <div
              ref={listRef}
              id={listboxId}
              role="listbox"
              tabIndex={0}
              aria-activedescendant={`${listboxId}-opt-${highlight}`}
              className="fixed z-[9999] overflow-y-auto overflow-x-hidden rounded-xl border border-zinc-700/90 bg-zinc-950 py-1 shadow-[0_16px_48px_-8px_rgba(0,0,0,0.65)] ring-1 ring-zinc-800/90 outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              style={{
                left: popover.left,
                width: popover.width,
                maxHeight: popover.maxHeight,
                ...("top" in popover ? { top: popover.top } : { bottom: popover.bottom }),
              }}
              onKeyDown={onListKeyDown}
            >
              {options.map((o, idx) => {
                const prevGroup = idx > 0 ? options[idx - 1]?.groupLabel : undefined;
                const showGroup = o.groupLabel && o.groupLabel !== prevGroup;
                const selected = o.value === value;
                const active = idx === highlight;
                return (
                  <div key={`${o.groupLabel ?? ""}-${o.value}-${idx}`}>
                    {showGroup ? (
                      <div
                        className="sticky top-0 z-[1] border-b border-zinc-800/80 bg-zinc-950/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 backdrop-blur-sm"
                        role="presentation"
                      >
                        {o.groupLabel}
                      </div>
                    ) : null}
                    <div
                      role="option"
                      id={`${listboxId}-opt-${idx}`}
                      data-idx={idx}
                      aria-selected={selected}
                      title={o.title}
                      className={`mx-1 cursor-pointer rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                        o.disabled
                          ? "cursor-not-allowed opacity-40"
                          : active
                            ? "bg-violet-500/20 text-violet-100"
                            : selected
                              ? "bg-zinc-800/80 text-zinc-100"
                              : "text-zinc-300 hover:bg-violet-500/10 hover:text-zinc-50"
                      }`}
                      onMouseEnter={() => !o.disabled && setHighlight(idx)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => !o.disabled && selectIndex(idx)}
                    >
                      <span className="block truncate">{o.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
});
