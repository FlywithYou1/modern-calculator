# 测试与质量保障指南

## 基本命令
- `npm run lint`：ESLint + Prettier 规则检查。
- `npm run test`：Vitest + jsdom 单元测试，覆盖前端核心交互。
- `npm run typecheck`：`vue-tsc --noEmit` 静态类型检查。
- `npm run build`：串行执行 lint、test、typecheck 后进行 Vite 打包。
- `npm run tauri build`：前端构建后调用 Tauri 打包桌面/移动应用。

## Rust 侧
- `cd src-tauri && cargo test --workspace --features precision-tests`：启用高精度相关测试。

## 覆盖率
- 前端：`npm run test -- --coverage`（基于 v8）。

## 常见依赖
- Windows：需 MSVC 工具链（已在 CI 使用 `x86_64-pc-windows-msvc`）。
- Linux：需 `libwebkit2gtk-4.1-dev` 等 WebView 依赖；CI 使用 Ubuntu 24.04。
- Android：确保已安装指定 NDK 版本，若需正式签名，请在 CI secrets 中提供 keystore 配置。