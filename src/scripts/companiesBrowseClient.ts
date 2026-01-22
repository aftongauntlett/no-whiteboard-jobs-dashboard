import { deferredInit } from "./companiesBrowse";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", deferredInit, { once: true });
} else {
  deferredInit();
}
