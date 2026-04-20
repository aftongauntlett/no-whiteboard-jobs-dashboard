export default {
  darkMode: "class",
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
        },
        coral: {
          DEFAULT: "var(--coral)",
        },
        bg: {
          light: "var(--bg)",
          dark: "var(--bg)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          light: "var(--surface)",
          dark: "var(--surface)",
          muted: "var(--surface-muted)",
          hover: "var(--surface-hover)",
        },
        border: {
          light: "var(--border)",
          dark: "var(--border)",
        },
        divider: {
          surface: "var(--divider-surface)",
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
        nav: {
          "active-bg": "var(--nav-active-bg)",
          "active-text": "var(--nav-active-text)",
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
        green: {
          bg: "var(--green-bg)",
          text: "var(--green-text)",
          border: "var(--green-border)",
        },
      },
    },
  },
  plugins: [],
};
