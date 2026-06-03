import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary - Electric Blue
        primary: {
          50: "#e6f4ff",
          100: "#b3ddff",
          200: "#80c6ff",
          300: "#4dafff",
          400: "#1a98ff",
          500: "#0080ff",
          600: "#0066cc",
          700: "#004d99",
          800: "#003366",
          900: "#001a33",
        },
        // Accent - Neon Cyan
        accent: {
          50: "#e6fffc",
          100: "#b3fff5",
          200: "#80ffee",
          300: "#4dffe7",
          400: "#1affe0",
          500: "#00e6c8",
          600: "#00b39c",
          700: "#008070",
          800: "#004d43",
          900: "#001a17",
        },
        // Surface colors for dark theme
        surface: {
          50: "#f5f5f5",
          100: "#e0e0e0",
          200: "#b0b0b0",
          300: "#808080",
          400: "#505050",
          500: "#303030",
          600: "#252525",
          700: "#1a1a1a",
          800: "#121212",
          900: "#0a0a0a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      animation: {
        "glow": "glow 2s ease-in-out infinite alternate",
        "float": "float 3s ease-in-out infinite",
        "slide-up": "slideUp 0.5s ease-out",
        "fade-in": "fadeIn 0.6s ease-out",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0, 128, 255, 0.3), 0 0 20px rgba(0, 128, 255, 0.1)" },
          "100%": { boxShadow: "0 0 20px rgba(0, 128, 255, 0.6), 0 0 40px rgba(0, 128, 255, 0.3)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "grid-pattern": "linear-gradient(rgba(0,128,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,128,255,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
    },
  },
  plugins: [],
};
export default config;
