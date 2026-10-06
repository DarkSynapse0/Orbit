// Orbit brand logo — the glossy chrome wordmark (icon = orbit ring + ¥ + rising
// trend + satellite). Shipped as a white version (for dark backgrounds) and an
// ink version (for light backgrounds); we swap by theme via CSS. `mark` renders
// the icon alone; `onDark` forces the white version (e.g. over the dark hero).
import Image from "next/image";

type Props = { className?: string; mark?: boolean; alt?: string; onDark?: boolean };

const DIMS = {
  wordmark: { w: 655, h: 193 },
  mark: { w: 253, h: 193 },
};

export function OrbitLogo({ className = "h-7", mark = false, alt = "Orbit", onDark = false }: Props) {
  const kind = mark ? "mark" : "wordmark";
  const { w, h } = DIMS[kind];
  const white = `/orbit-${kind}-white.png`;
  const ink = `/orbit-${kind}-ink.png`;
  const base = `${className} w-auto select-none`;

  // Over a permanently-dark surface (landing hero / footer) always use white.
  if (onDark) {
    return <Image src={white} alt={alt} width={w} height={h} className={base} priority />;
  }

  // Otherwise follow the theme: ink on light, white on dark.
  return (
    <>
      <Image src={ink} alt={alt} width={w} height={h} className={`${base} block dark:hidden`} priority />
      <Image src={white} alt="" width={w} height={h} aria-hidden className={`${base} hidden dark:block`} priority />
    </>
  );
}

export function OrbitMark({
  className = "h-8",
  alt = "Orbit",
  onDark = false,
}: {
  className?: string;
  alt?: string;
  onDark?: boolean;
}) {
  return <OrbitLogo mark className={className} alt={alt} onDark={onDark} />;
}
