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
    },
  },
});