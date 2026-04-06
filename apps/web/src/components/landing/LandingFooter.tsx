import { Link } from "react-router-dom";

const GITHUB_URL = "https://github.com/manhhoangg2k2/mock-api-data";

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950 px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-zinc-500">© {year} DevMock. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link
            to="/docs"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-violet-400"
          >
            Hướng dẫn
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-violet-400"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
