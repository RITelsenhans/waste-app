import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Action, Card, StatusBadge } from "../src";

describe("Action", () => {
  it("renders navigation as a native link with its accessible text", () => {
    const markup = renderToStaticMarkup(
      <Action href="#details" tone="secondary">
        Details öffnen
      </Action>,
    );

    expect(markup).toContain('<a href="#details"');
    expect(markup).toContain("waste-action--secondary");
    expect(markup).toContain("Details öffnen");
  });

  it("defaults actions without href to a button that cannot submit forms", () => {
    const markup = renderToStaticMarkup(<Action disabled>Erneut versuchen</Action>);

    expect(markup).toContain("<button");
    expect(markup).toContain('type="button"');
    expect(markup).toContain("disabled");
  });
});

describe("Card", () => {
  it("preserves the semantic element selected by the consumer", () => {
    const markup = renderToStaticMarkup(
      <Card as="article" elevation="flat">
        Inhalt
      </Card>,
    );

    expect(markup).toContain("<article");
    expect(markup).toContain("waste-card--flat");
  });
});

describe("StatusBadge", () => {
  it("keeps status text visible and marks only the color indicator decorative", () => {
    const markup = renderToStaticMarkup(<StatusBadge tone="success">Planmäßig</StatusBadge>);

    expect(markup).toContain("waste-status-badge--success");
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain("Planmäßig");
  });
});
