import type { CSSProperties } from "react";
import { ShieldCheck, Eye, RefreshCw, TrendingUp, type LucideIcon } from "lucide-react";

type FloatItem = {
  Icon: LucideIcon;
  label: string;
  desc: string;
  pos: string; // absolute placement within the hero
  rx: string; // resting tilt (x)
  ry: string; // resting tilt (y)
  delay: string; // bob offset so they don't float in sync
  iconColor: string;
  glow: string;
  tipAnchor: string; // where the tooltip sits relative to the tile
};

// The four trust attributes, floated around the headline as 3D tiles.
const ITEMS: FloatItem[] = [
  {
    Icon: ShieldCheck,
    label: "Non-custodial",
    desc: "Only your key can withdraw. Orbit can never take your money.",
    pos: "left-[7%] top-[26%]",
    rx: "9deg",
    ry: "16deg",
    delay: "0s",
    iconColor: "text-indigo-200",
    glow: "bg-indigo-500/15",
    tipAnchor: "left-1/2 top-[calc(100%+12px)] -translate-x-1/2",
  },
  {
    Icon: Eye,
    label: "Transparent",
    desc: "Every dollar lives on-chain. Verify the vault on Solscan anytime.",
    pos: "right-[8%] top-[22%]",
    rx: "9deg",
    ry: "-16deg",
    delay: "1.4s",
    iconColor: "text-sky-200",
    glow: "bg-sky-500/15",
    tipAnchor: "right-1/2 top-[calc(100%+12px)] translate-x-1/2",
  },
  {
    Icon: RefreshCw,
    label: "Liquid",
    desc: "No lock-ups. Withdraw your full balance in a single click.",
    pos: "left-[12%] bottom-[24%]",
    rx: "-8deg",
    ry: "13deg",
    delay: "0.7s",
    iconColor: "text-cyan-200",
    glow: "bg-cyan-500/15",
    tipAnchor: "left-1/2 bottom-[calc(100%+12px)] -translate-x-1/2",
  },
  {
    Icon: TrendingUp,
    label: "Productive",
    desc: "Earns real yield, paid out in tokens from an on-chain reserve.",
    pos: "right-[11%] bottom-[22%]",
    rx: "-8deg",
    ry: "-13deg",
    delay: "2.1s",
    iconColor: "text-emerald-200",
    glow: "bg-emerald-500/15",
    tipAnchor: "right-1/2 bottom-[calc(100%+12px)] translate-x-1/2",
  },
];

export function FloatingIcons() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 hidden lg:block" aria-hidden>
      {ITEMS.map((it) => (
        <div key={it.label} className={`float-group pointer-events-auto absolute ${it.pos}`}>
          <div className="animate-icon-float" style={{ animationDelay: it.delay }}>
            <div
              className="float-tile relative grid h-[70px] w-[70px] place-items-center rounded-full border border-white/15 bg-gradient-to-br from-white/[0.16] to-white/[0.03] shadow-[0_18px_44px_-14px_rgba(2,6,23,0.85)] backdrop-blur-sm"
              style={{ ["--rx" as string]: it.rx, ["--ry" as string]: it.ry } as CSSProperties}
            >
              {/* colored glow */}
              <div className={`pointer-events-none absolute inset-0 rounded-full ${it.glow} blur-[2px]`} />
              {/* coin rim */}
              <div className="pointer-events-none absolute inset-[3px] rounded-full ring-1 ring-inset ring-white/10" />
              {/* top gloss arc for the 3D coin read */}
              <div className="pointer-events-none absolute inset-x-3 top-2 h-2/5 rounded-[50%] bg-gradient-to-b from-white/35 to-transparent blur-[1px]" />
              <it.Icon className={`relative h-7 w-7 ${it.iconColor}`} strokeWidth={1.75} />
            </div>

            {/* hover tooltip */}
            <div className={`absolute z-10 ${it.tipAnchor}`}>
              <div className="float-tip w-max max-w-[220px] rounded-xl border border-white/10 bg-[#0c0c12]/95 px-3.5 py-2.5 text-left shadow-2xl backdrop-blur">
                <div className="text-[13px] font-semibold text-white">{it.label}</div>
                <div className="mt-0.5 text-[12px] leading-snug text-neutral-400">{it.desc}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
