import { mount } from "svelte";
import App from "./App.svelte";
import "./app.css";

const app = mount(App, {
  target: document.getElementById("app")!,
});

// Add a short-lived `is-scrolling` class to the root while the user scrolls.
// This lets CSS show scrollbars only during active scrolling.
let __scrollTimer: number | undefined;
function __handleScroll() {
  document.documentElement.classList.add("is-scrolling");
  if (__scrollTimer) window.clearTimeout(__scrollTimer);
  __scrollTimer = window.setTimeout(() => {
    document.documentElement.classList.remove("is-scrolling");
    __scrollTimer = undefined;
  }, 300);
}
document.addEventListener("scroll", __handleScroll, { passive: true, capture: true });

export default app;
