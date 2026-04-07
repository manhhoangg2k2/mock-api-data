import { useEffect, useRef } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AppBar } from "@/components/AppBar";
import { useAuth } from "@/context/AuthContext";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { GuestGenerator } from "@/components/landing/GuestGenerator";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { AppLoadingScreen } from "@/components/ui/AppLoadingScreen";

/** Ngưỡng scroll-spy: ≥ scroll-mt-24 của #pricing (+ slack). */
const LANDING_PRICING_HASH_TOP_PX = 132;

export function LandingPage() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { token, ready } = useAuth();
  const scrollSpyPaused = useRef(false);

  useEffect(() => {
    if (!ready || loc.pathname !== "/" || loc.hash !== "#pricing") return;
    scrollSpyPaused.current = true;
    let inner: number | undefined;
    const outer = window.setTimeout(() => {
      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
      inner = window.setTimeout(() => {
        scrollSpyPaused.current = false;
      }, 1100);
    }, 50);
    return () => {
      window.clearTimeout(outer);
      if (inner !== undefined) window.clearTimeout(inner);
    };
  }, [ready, loc.pathname, loc.hash]);

  useEffect(() => {
    if (!ready || token || loc.pathname !== "/") return;

    const syncHashFromScroll = () => {
      if (scrollSpyPaused.current) return;
      const pricing = document.getElementById("pricing");
      if (!pricing) return;
      const top = pricing.getBoundingClientRect().top;
      const wantPricing = top <= LANDING_PRICING_HASH_TOP_PX;
      const hasPricingHash = window.location.hash === "#pricing";
      if (wantPricing && !hasPricingHash) {
        navigate({ pathname: "/", hash: "pricing" }, { replace: true });
      } else if (!wantPricing && hasPricingHash) {
        navigate({ pathname: "/", hash: "" }, { replace: true });
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        syncHashFromScroll();
      });
    };

    syncHashFromScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ready, token, loc.pathname, navigate]);

  if (!ready) {
    return <AppLoadingScreen layout="fullscreen" message="Đang chuẩn bị giao diện…" />;
  }

  if (token) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-300 antialiased">
      <AppBar />
      <main>
        <LandingHero />
        <LandingFeatures />
        <section
          id="guest-generator"
          className="scroll-mt-24 border-t border-zinc-800/60 bg-zinc-900/30"
          aria-label="Guest mock generator"
        >
          <GuestGenerator />
        </section>
        <LandingPricing />
      </main>
      <LandingFooter />
    </div>
  );
}
