import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "calendar"
  | "camera"
  | "car"
  | "chevron-right"
  | "gate"
  | "home"
  | "info"
  | "key"
  | "map-pin"
  | "megaphone"
  | "recycle"
  | "scan"
  | "search"
  | "sparkles"
  | "television"
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
  camera: (
    <>
      <path d="M4 7h4l1.5-2h5L16 7h4a1 1 0 0 1 1 1v11H3V8a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="4" />
      <path d="M18 10h.01" />
    </>
  ),
  car: (
    <>
      <path d="M4 15v-3l2-5h12l2 5v3" />
      <path d="M3 15h18v4H3zM7 19v2M17 19v2M6 12h12" />
      <circle cx="7" cy="15.5" r="1" />
      <circle cx="17" cy="15.5" r="1" />
    </>
  ),
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  gate: (
    <>
      <path d="M4 21V8M20 21V8M4 10h16" />
      <path d="m5 10 4 4 4-4 4 4 3-3M8 21v-5M16 21v-5" />
    </>
  ),
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
  key: (
    <>
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h9M17 12v3M20 12v2" />
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
  scan: (
    <>
      <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
      <path d="M7 12h10M9 9h6M9 15h6" />
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
  television: (
    <>
      <rect x="3" y="5" width="18" height="13" rx="2" />
      <path d="M8 22h8M12 18v4M9 2l3 3 3-3" />
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
