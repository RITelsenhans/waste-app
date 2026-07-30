import type { HTMLAttributes, ReactElement } from "react";
import { classNames } from "./class-names";

type CardElement = "article" | "aside" | "div" | "section";

export type CardProps = HTMLAttributes<HTMLElement> & {
  as?: CardElement;
  elevation?: "flat" | "raised";
};

export function Card({
  as: Component = "div",
  className,
  elevation = "raised",
  ...props
}: CardProps): ReactElement {
  return (
    <Component
      {...props}
      className={classNames("waste-card", `waste-card--${elevation}`, className)}
    />
  );
}
