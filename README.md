# 小方 AI 助手

> 一个会注意你、回应你，也能随时与你对话的轻量 AI 小助手。

小方通过眼神跟随、表情变化和轻微动作感知用户的操作状态，并支持快速接入 OpenAI-compatible API、自定义模型与角色人设。角色的视觉表现和交互动画完全由前端技术实现，无需 3D 模型，在保持轻量运行的同时，让 AI 对话拥有更明确的陪伴感和生命感。

![状态](https://img.shields.io/badge/status-prototype-2026.11.20-2f855a)
![平台](https://img.shields.io/badge/platform-Web%20%7C%20Windows-2563eb)
![Electron](https://img.shields.io/badge/Electron-39-47848f)

## 产品定义

小方不是一个缩小版的通用聊天软件，也不是只提供装饰效果的桌面宠物。它将“被注意的感觉”与实用的轻量 AI 对话结合起来：平时安静地待在屏幕边缘，在用户靠近、移动鼠标或发起操作时通过眼神和动作做出反馈，需要时再以最短路径进入对话。

核心价值：

- **注意你**：视线、转头和表情会响应鼠标与交互状态。
- **快速可用**：配置 API、模型和人设后即可开始对话。
- **轻量对话**：适合随手提问、快速确认和简短辅助，不打断当前工作。
- **前端表达**：角色动画由 HTML、CSS 和 JavaScript 驱动，便于扩展和嵌入。
- **用户可控**：API Key 仅保存在当前会话，菜单、闲置和对话状态均可主动控制。

## 功能

- 眼睛跟随鼠标，远距离时逐渐带动头部转向。
- 中性、喜悦、愤怒、悲伤、兴奋、惊讶、好奇和困倦表情。
- 右键环形功能菜单：API、人设、对话和闲置模式。
- 鼠标静止 1 分钟自动闲置，或手动闲置 5 分钟。
- OpenAI-compatible `/chat/completions` 与 SSE 流式响应。
- 会话关闭、重新开始、中止回答和错误状态。
- 网页开发版与透明置顶的 Windows 桌面版共用一套前端代码。
- 桌面托盘支持显示、隐藏、恢复位置、置顶和退出。

## 快速开始

网页开发版无需构建，直接打开 `index.html`。也可以启动本地服务器：

```bash
python3 -m http.server 4177
```

浏览器访问：

```text
http://127.0.0.1:4177/
```

启动 Electron 桌面开发版：

```bash
npm install
npm run desktop
```

## Windows 运行包

GitHub Release 中的 `XiaofangAssistant-win32-x64.zip` 是免安装版本：

1. 下载并完整解压 ZIP。
2. 双击 `XiaofangAssistant.exe`。
3. 不要只复制 EXE，程序依赖同目录中的运行时文件。

自行构建 Windows x64 免安装包：

```bash
npm install
npm run package:win:zip
```

在 Windows 中构建带桌面快捷方式的 NSIS 安装器：

```bash
npm install
npm run package:win:installer
```

## API 配置

右键机器人，选择蓝色设置球：

- `API Base URL`：兼容 OpenAI `/chat/completions` 的接口根地址。
- `API Key`：仅保存在当前应用会话的 `sessionStorage`。
- `模型`：填写服务商支持的模型名称。

API Key 不会写入仓库、消息历史或长期本地存储。

## 项目结构

```text
desktop/              Electron 主进程、预加载和构建脚本
docs/                 交互规格、教程和动作定义
src/components/       机器人、菜单、聊天与设置组件
src/data/             菜单和表情定义
src/services/         会话存储与 API 客户端
styles/               网页、组件与桌面模式样式
index.html            网页开发版入口
```

## 文档

- [Windows 桌面版说明](docs/Windows桌面版说明.md)
- [机器人眼神交互教程](docs/机器人眼神交互教程.md)
- [机器人表情动作定义](docs/机器人表情动作定义.md)
- [闲置场景试验台](docs/闲置场景试验台.md)
- [小方 AI 助手产品需求与交互规格](docs/网页AI小助手需求与交互规格.md)
- [版本记录](CHANGELOG.md)

## 发布

推送 `v*` 标签后，GitHub Actions 会构建 Windows 免安装 ZIP、NSIS 安装器和源码 ZIP，并创建对应 GitHub Release。也可以在 Actions 页面手动运行构建流程，只生成可下载的构建产物。

本地生成源码包：

```bash
npm run package:source
```

## 许可证

本项目采用 [MIT License](LICENSE) 开源。
