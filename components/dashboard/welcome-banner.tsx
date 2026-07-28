import Link from "next/link";

interface WelcomeBannerProps {
  title: string;
  subtitle: string;
  cta?: { label: string; href: string };
}

export function WelcomeBanner({ title, subtitle, cta }: WelcomeBannerProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl px-7 py-6"
      style={{ background: "linear-gradient(120deg,#C81E3A,#9E1B3D)" }}
    >
      <div>
        <div className="text-xl font-extrabold text-white">{title}</div>
        <div className="mt-1 text-sm text-white/85">{subtitle}</div>
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="shrink-0 rounded-xl border border-white/40 bg-white/15 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/25"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
