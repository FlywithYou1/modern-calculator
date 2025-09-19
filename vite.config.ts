// Simple Vite configuration
export default {
  clearScreen: false,
  server: {
    port: 3000,
    strictPort: false,
    host: '0.0.0.0',
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    target: "esnext",
    outDir: "dist",
    sourcemap: true,
    minify: 'esbuild',
  },
  envPrefix: ["VITE_", "TAURI_"],
  define: {
    __APP_VERSION__: '"2.0.0"',
  },
}
