/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gray: {
          750: "#2D3748",
        },
        gpac: {
          navy: "#151B3A",
          coral: "#FF5A5F",
          coralD: "#E64545",
          wine: "#8E1E2D",
        },
        monitor: {
          app: "#0c1117",

          surface: "#101722",

          panel: "#0f141b",

          line: "#ffffff1a",
          download: "#6081B7",

          divider: "#ffffff1a",

          /** Texte */
          text: {
            primary: "#f2f2f2",
            secondary: "#c7c7c7",
            muted: "#9aa3ae",
          },
        },
      },
      spacing: {
        "widget-sm": "300px",
        "widget-md": "400px",
        "widget-lg": "500px",
      },
      minHeight: {
        widget: "200px",
      },
      maxHeight: {
        widget: "800px",
      },

      cursor: {
        move: "move",
      },
      fontFamily: {
        ui: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
        cond: ["Archivo Narrow", "Inter", "sans-serif"],
      },

      animation: {
        overlayShow: "overlayShow 150ms cubic-bezier(0.16, 1, 0.5, 1)",
        overlayHide: "overlayHide 150ms cubic-bezier(0.16, 1, 0.5, 1)",
        contentShow: "contentShow 150ms cubic-bezier(0.16, 1, 0.5, 1)",
        contentHide: "contentHide 150ms cubic-bezier(0.16, 1, 0.5, 1)",
        popoverShow: "popoverShow 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        popoverHide: "popoverHide 200ms cubic-bezier(0.5, 0, 0.84, 0)",
      },
      keyframes: {
        overlayShow: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        overlayHide: {
          from: { opacity: 1 },
          to: { opacity: 0 },
        },
        contentShow: {
          from: {
            opacity: 0,
            transform: "translate(-50%, -48%) scale(0.96)",
          },
          to: {
            opacity: 1,
            transform: "translate(-50%, -50%) scale(1)",
          },
        },
        contentHide: {
          from: {
            opacity: 1,
            transform: "translate(-50%, -50%) scale(1)",
          },
          to: {
            opacity: 0,
            transform: "translate(-50%, -48%) scale(0.96)",
          },
        },

        popoverShow: {
          from: {
            opacity: 0,
            transform: "translateY(-8px) scale(0.96)",
          },
          to: {
            opacity: 1,
            transform: "translateY(0) scale(1)",
          },
        },
        popoverHide: {
          from: {
            opacity: 1,
            transform: "translateY(0) scale(1)",
          },
          to: {
            opacity: 0,
            transform: "translateY(-8px) scale(0.96)",
          },
        },
      },
    },
  },
  plugins: [
    // Plugin pour ajouter la pseudo-classe before avec l'indicateur de drag
    function ({ addUtilities }) {
      const newUtilities = {
        ".drag-indicator": {
          "&::before": {
            content: '""',
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            height: "4px",
            background: "rgba(59, 130, 246, 0.5)",
            opacity: "0",
            transition: "opacity 0.2s ease-in-out",
          },
          "&:hover::before": {
            opacity: "1",
          },
        },
      };
      addUtilities(newUtilities, ["hover"]);
    },
  ],
  // Activation du mode JIT
  mode: "jit",
};
