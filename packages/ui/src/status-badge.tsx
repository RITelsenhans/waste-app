import type { HTMLAttributes, ReactElement } from "react";
import { classNames } from "./class-names";

export type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
};

export function StatusBadge({
  children,
  className,
  tone = "neutral",
  ...props
}: StatusBadgeProps): ReactElement {
  return (
    <span
      {...props}
      className={classNames("waste-status-badge", `waste-status-badge--${tone}`, className)}
    >
      <span aria-hidden="true" className="waste-status-badge__indicator" />
      <span>{children}</span>
    </span>
  );
}
