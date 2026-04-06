import type { ReactNode } from "react";

type LandingCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

export function LandingCard({ icon, title, description }: LandingCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm transition-colors hover:border-zinc-700/90 hover:bg-zinc-800/50">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}
