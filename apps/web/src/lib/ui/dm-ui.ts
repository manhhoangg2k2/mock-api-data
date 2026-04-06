export const dm = {
  container: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
  sectionPad: "py-24",

  bg: {
    app: "bg-zinc-950",
    panel: "bg-zinc-900",
    panelLow: "bg-zinc-900/40",
    panelLower: "bg-zinc-900/30",
    panelLowest: "bg-zinc-900/20",
    input: "bg-zinc-950",
  },
  border: {
    base: "border-zinc-800",
    soft: "border-zinc-800/80",
    faint: "border-zinc-800/60",
  },
  text: {
    primary: "text-zinc-50",
    secondary: "text-zinc-400",
    muted: "text-zinc-500",
    danger: "text-rose-300",
  },

  // Buttons
  btn: {
    primary:
      "rounded-lg bg-violet-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-colors hover:bg-violet-600 active:scale-[0.98] disabled:opacity-50",
    outline:
      "rounded-lg border border-zinc-700 bg-transparent px-6 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800/40 disabled:opacity-50",
    ghost:
      "rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800/50 hover:text-zinc-100",
  },

  panel: {
    default:
      "rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-sm backdrop-blur-sm",
    soft: "rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6",
    tight: "rounded-lg border border-zinc-800 bg-zinc-900/20 p-4",
  },

  badge: {
    release:
      "inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-950/25 px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-widest text-amber-100",
    warning:
      "inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-950/25 px-4 py-3 text-left text-sm text-amber-100/90",
    popular:
      "absolute -top-3 right-6 translate-y-1/2 rounded-full bg-violet-500 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-tighter text-white",
  },

  heading: {
    h2: "text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl",
    h3: "text-lg font-bold text-zinc-50",
    hero: "text-4xl md:text-6xl font-extrabold tracking-tighter text-zinc-50",
  },

  code: {
    pre:
      "font-mono text-[0.75rem] leading-relaxed text-zinc-300 overflow-hidden",
    inlineUrl: "font-mono text-sm text-violet-500",
    highlightLine: "bg-rose-950/50 text-rose-200",
  },
} as const;

