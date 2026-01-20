/// <reference types="astro/client" />

declare global {
  interface Window {
    __setTheme?: (theme: string) => string;
    __toggleTheme?: () => string;
  }
}

export {};
