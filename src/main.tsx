import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Self-hosted fonts: loading them from Google Fonts would send visitors' IPs to Google.
import "@fontsource-variable/dm-sans/opsz.css";
import "@fontsource/victor-mono/latin-400.css";
import "@fontsource/victor-mono/latin-500.css";
import "@fontsource/victor-mono/latin-600.css";
import "./index.css";
import { App } from "./components/App/App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
