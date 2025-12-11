import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";

// Update HTML lang attribute when language changes
import i18n from "./i18n/config";
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});
// Set initial language
document.documentElement.lang = i18n.language || 'en';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
