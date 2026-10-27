import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        test: {
          name: "server",
          environment: "node",
          include: ["tests/unit/**/*.test.js", "tests/api/**/*.test.js"],
        },
      },
      {
        plugins: [react()],
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["tests/ui/**/*.test.jsx"],
          setupFiles: ["tests/setup-ui.js"],
        },
      },
    ],
  },
});
