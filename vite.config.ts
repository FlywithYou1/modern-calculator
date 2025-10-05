import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  clearScreen: false,
  server: {
    port: 3000,
    strictPort: false,
    host: '0.0.0.0', // 允许移动端访问
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    target: "esnext",
    outDir: './dist',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: './index.html',
      },
      output: {
        manualChunks: {
          vendor: ['@tauri-apps/api'],
        },
      },
    },
  },
  resolve: {
    alias: [
      { find: '@/components', replacement: './src/components' },
      { find: '@/styles', replacement: './src/styles' },
      { find: '@/utils', replacement: './src/utils' },
      { find: '@/types', replacement: './src/types' },
      { find: '@/mobile', replacement: './src/mobile' },
      { find: '@/tests', replacement: './src/tests' },
      { find: '@', replacement: './src' },
    ],
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 使用现代 SCSS 语法，不再需要全局导入变量文件
        // 因为我们使用 CSS 自定义属性代替 SCSS 变量
        silenceDeprecations: ["legacy-js-api"],
      },
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})
