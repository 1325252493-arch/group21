import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App.jsx";
import "@/index.css";
import { LanguageProvider } from "@/lib/LanguageContext.jsx";
import { AuthProvider } from "@/lib/AuthContext";
import { SettingsProvider } from "@/lib/SettingsContext";

async function bootstrap() {
  // The initial CSS variable is now handled by SettingsProvider
  
  ReactDOM.createRoot(document.getElementById("root")).render(
    <AuthProvider>
      <LanguageProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

bootstrap();