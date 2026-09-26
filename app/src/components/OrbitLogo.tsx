/* eslint-disable @next/next/no-img-element */
// Orbit brand logo. The source art is white on transparent, so we invert it on
// the light theme (white -> dark) and leave it as-is on dark. `mark` renders the
// planet icon alone; default renders the icon + wordmark lockup.

type Props = { className?: string; mark?: boolean; alt?: string };

export function OrbitLogo({ className = "h-7", mark = false, alt = "Orbit" }: Props) {
  const src = mark ? "/orbit-mark.png" : "/orbit-wordmark.png";
  return (
    <img
      src={src}
      alt={alt}
      className={`${className} w-auto select-none invert dark:invert-0`}
      draggable={false}
    />
  );
}

export function OrbitMark({ className = "h-8", alt = "Orbit" }: { className?: string; alt?: string }) {
  return <OrbitLogo mark className={className} alt={alt} />;
}
