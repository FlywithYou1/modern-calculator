# 贡献指南 (CONTRIBUTING)

感谢你的贡献！请遵循以下流程，确保跨平台质量和一致性。

## 分支与提交
- 使用 feature/*、fix/*、chore/* 分支命名
- 提交信息遵循 Conventional Commits（feat:, fix:, chore:, docs:, refactor:, test:, build:, ci:）

## 本地开发
- Node.js >= 18，Rust >= 1.60
- Windows/macOS/Linux 任一平台都应能运行：

```pwsh
npm ci
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run build
npm run tauri:build
```

## 质量门（PR 必须通过）
- 依赖安装成功
- Lint / Format 通过
- 前端单元测试通过（vitest）
- Rust 单元测试通过（cargo test --manifest-path src-tauri/Cargo.toml）
- 至少一个平台构建产物成功（tauri build）

## 跨平台要求
- 不引入平台专用路径/分隔符；避免 Node 原生模块除非必要
- 如引入原生依赖，PR 中写明：来源、支持平台、编译步骤、系统包需求，并在 CI 中模拟
- Linux 桌面依赖（示例）：libwebkit2gtk-4.1-dev（或 4.0）、libappindicator3-dev、librsvg2-dev、patchelf

## 安全与密钥
- 禁止提交明文密钥、证书、keystore 等
- 发布签名密钥等通过 GitHub Secrets 注入（可选：TAURI_SIGNING_PRIVATE_KEY, TAURI_SIGNING_PRIVATE_KEY_PASSWORD）

## 国际化
- UI 文本使用 i18n 上下文（src/contexts/I18nContext.tsx）
- 新增/修改功能需同步更新多语言文案

## 性能与动画
- 遵循性能模式：低性能模式下自动关闭动画（全局 .reduced-motion 已实现）
- 优先使用 transform/opacity 与 GPU 加速

## 测试
- 为计算引擎新增/修改逻辑时请补充单元测试
- 覆盖率目标 ≥ 80%（后续可接入覆盖率统计）

## 发版
- 通过 GitHub Actions release 工作流生成多平台安装包
- 移动端（Android/iOS）需在对应平台完成签名与工具链配置后再启用
