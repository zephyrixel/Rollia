# Rollia

Rollia 是一个基于 Tauri 的随机点名桌面应用，前端使用 React + TypeScript，桌面壳使用 Tauri 2。它面向课堂、会议等需要快速抽取名单的场景，提供动画点名、历史记录、名单管理和声音反馈等体验。

## 功能特性

- 带动画转场的随机点名界面
- 支持“可重复”和“不重复”两种点名模式
- 本地持久化保存名单、历史记录和设置
- 最近点名结果历史轨道
- 声音效果与静音切换
- 自定义无边框桌面窗口标题栏与窗口控制

## 技术栈

- React 19
- TypeScript
- Vite
- Zustand
- Motion
- Tauri 2
- Rust

## 项目结构

```text
.
├── src/                # React 前端应用
│   ├── components/     # UI 组件
│   ├── hooks/          # 前端 Hooks
│   ├── lib/            # 点名逻辑、随机、声音、存储等工具模块
│   ├── state/          # Zustand 状态与类型定义
│   └── styles/         # 全局样式、设计令牌
├── src-tauri/          # Tauri 与 Rust 宿主应用
├── public/             # 静态资源
└── .github/workflows/  # GitHub Actions 工作流
```

## 环境要求

- Node.js 20+
- pnpm 11+
- Rust stable toolchain
- 当前平台所需的 Tauri 构建依赖

在 Linux 上本地运行 Tauri 时，通常还需要预先安装 WebKitGTK 及其相关系统依赖。

## 快速开始

安装依赖：

```bash
pnpm install
```

仅启动前端开发服务器：

```bash
pnpm dev
```

启动桌面应用开发模式：

```bash
pnpm tauri dev
```

构建前端产物：

```bash
pnpm build
```

构建桌面应用：

```bash
pnpm tauri build
```

## 工作原理

- 前端状态集中管理在 `src/state/store.ts`，使用 Zustand 实现。
- 名单、历史记录、模式和设置通过 `localStorage` 持久化。
- Tauri 侧目前主要作为轻量桌面宿主，负责窗口承载与桌面能力接入。
- 点名流程围绕 `idle`、`winding`、`spinning`、`locked` 四个阶段展开。

## 持续集成

仓库内包含 GitHub Actions 工作流，可在 Windows 环境下自动构建桌面应用，并将构建产物作为 workflow artifact 上传。

## 开源协议

本项目基于 MIT License 开源，详见 [LICENSE](LICENSE)。
