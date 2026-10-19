import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@waste/design-tokens/tokens.css";
import { App } from "./App";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Der App-Einstiegspunkt fehlt.");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
