import { createRoot } from "react-dom/client";

import { App } from "./ui.tsx";
import "./ui.css";
import "sonner/dist/styles.css";

const root = document.querySelector("#root");
if (!root) throw new Error("missing #root");
createRoot(root).render(<App />);
