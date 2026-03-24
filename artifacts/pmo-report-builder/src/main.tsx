import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import PMODashboard from "./pages/PMODashboard";
import { AppStateProvider } from "./context/AppState";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AppStateProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/pmo" element={<PMODashboard />} />
      </Routes>
    </BrowserRouter>
  </AppStateProvider>
);
