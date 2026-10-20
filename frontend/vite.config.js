import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API = "http://127.0.0.1:8000";

// Envía al backend solo las llamadas de API (axios/fetch).
// Las navegaciones del navegador (F5 o enlace directo a /tickets)
// piden text/html: se devuelven al frontend para que React Router las resuelva.
const apiProxy = {
  target: API,
  changeOrigin: true,
  bypass(req) {
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return "/index.html";
    }
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": apiProxy,
      "/tickets": apiProxy,
      "/areas": apiProxy,
      "/metrics": apiProxy,
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          if (
            id.includes("jspdf")
            || id.includes("html2canvas")
            || id.includes("canvg")
            || id.includes("dompurify")
            || id.includes("fflate")
            || id.includes("fast-png")
            || id.includes("rgbcolor")
            || id.includes("stackblur")
            || id.includes("svg-pathdata")
            || id.includes("css-line-break")
            || id.includes("text-segmentation")
            || id.includes("utrie")
            || id.includes("raf")
          ) {
            return "vendor-pdf";
          }
          if (id.includes("exceljs")) return "vendor-excel";
          if (id.includes("lucide")) return "vendor-icons";
          if (id.includes("react")) return "vendor-react";
          return "vendor";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
  },
});
