import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { classNames } from "./class-names";

type ActionBaseProps = {
  children: ReactNode;
  className?: string;
  tone?: "primary" | "secondary";
};

export type ActionLinkProps = ActionBaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export type ActionButtonProps = ActionBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

export type ActionProps = ActionLinkProps | ActionButtonProps;

function nativeProps<T extends ActionProps>(props: T): Omit<T, keyof ActionBaseProps> {
  const result: Partial<T> = { ...props };
  delete result.children;
  delete result.className;
  delete result.tone;
  return result as Omit<T, keyof ActionBaseProps>;
}

export function Action(props: ActionLinkProps): ReactElement;
export function Action(props: ActionButtonProps): ReactElement;
export function Action(props: ActionProps): ReactElement {
  const tone = props.tone ?? "primary";
  const actionClassName = classNames("waste-action", `waste-action--${tone}`, props.className);

  if ("href" in props && typeof props.href === "string") {
    const anchorProps = nativeProps(props);
    return (
      <a {...anchorProps} className={actionClassName}>
        {props.children}
      </a>
    );
  }

  const buttonProps = nativeProps(props);
  return (
    <button {...buttonProps} className={actionClassName} type={props.type ?? "button"}>
      {props.children}
    </button>
  );
}
