import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "calendar"
  | "chevron-right"
  | "home"
  | "info"
  | "map-pin"
  | "megaphone"
  | "recycle"
  | "search"
  | "sparkles"
  | "truck"
  | "warning";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  name: IconName;
  label?: string;
};

const paths: Record<IconName, ReactNode> = {
  calendar: (
    <>
      <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
      <path d="M8 13h3v3H8z" />
    </>
  ),
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5h.01" />
    </>
  ),
  "map-pin": (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 11v3a2 2 0 0 0 2 2h2l8 4V5L8 9H6a2 2 0 0 0-2 2Z" />
      <path d="m8 16 1.5 5M19 8a5 5 0 0 1 0 9" />
    </>
  ),
  recycle: (
    <>
      <path d="m9 4 3-2 3 2M12 2v6M5 9l-3 1 1 3M2 10l5 3M17 13l5-3-1-3M22 10l-5 3" />
      <path d="M7 13 4 18h6M17 13l3 5h-6" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 2 1.4 4.6L18 8l-4.6 1.4L12 14l-1.4-4.6L6 8l4.6-1.4L12 2Z" />
      <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15ZM5 13l.7 2.3L8 16l-2.3.7L5 19l-.7-2.3L2 16l2.3-.7L5 13Z" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 9v5M12 17.5h.01" />
    </>
  ),
};

export function Icon({ name, label, className, ...props }: IconProps) {
  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={["waste-icon", className].filter(Boolean).join(" ")}
      fill="none"
      focusable="false"
      role={label ? "img" : undefined}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
