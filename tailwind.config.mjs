export default {
  darkMode: "class",
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          light: "var(--bg)",
          dark: "var(--bg)",
        },
        surface: {
          light: "var(--surface)",
          dark: "var(--surface)",
        },
        border: {
          light: "var(--border)",
          dark: "var(--border)",
        },
        text: {
          light: "var(--text)",
          dark: "var(--text)",
          mutedLight: "var(--text-muted)",
          mutedDark: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
        },
        success: {
          bg: "var(--success-bg)",
          text: "var(--success-text)",
          border: "var(--success-border)",
        },
        warning: {
          bg: "var(--warning-bg)",
          text: "var(--warning-text)",
          border: "var(--warning-border)",
        },
        info: {
          bg: "var(--info-bg)",
          text: "var(--info-text)",
          border: "var(--info-border)",
        },
      },
    },
  },
  plugins: [],
};
