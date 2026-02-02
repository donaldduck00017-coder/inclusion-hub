import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize the platform control plane
import { initializePlatform } from "./lib/platformInit";
initializePlatform();

createRoot(document.getElementById("root")!).render(<App />);
