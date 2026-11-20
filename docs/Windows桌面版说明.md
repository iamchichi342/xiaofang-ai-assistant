# Windows 桌面版

## 保留的两个入口

- 网页开发版：继续使用根目录的 `index.html` 和现有本地服务器。
- Windows 桌面版：Electron 直接加载同一份 `index.html`、`src/` 和 `styles/`，不会产生第二套业务代码。

项目首页和完整开发说明见根目录 `README.md`。

## 直接运行开发版桌面程序

```bash
npm install
npm run desktop
```

桌面模式默认使用透明、无边框、始终置顶窗口，并停靠在主屏幕右下角。透明空白区域支持点击穿透。托盘菜单可以显示、隐藏、恢复位置、切换置顶和退出。

## 生成 Windows 可运行目录和 ZIP

在 macOS、Linux 或 Windows 中运行：

```bash
npm install
npm run package:win:zip
```

输出：

```text
release/XiaofangAssistant-win32-x64/
release/XiaofangAssistant-win32-x64/XiaofangAssistant.exe
release/XiaofangAssistant-win32-x64.zip
```

ZIP 解压后，双击 `XiaofangAssistant.exe` 即可运行。整个目录需要一起保留，不能只复制单个 EXE。

跨平台生成的 EXE 使用 Electron 默认外壳图标，程序运行后的托盘图标仍为小方。需要 EXE、安装器和桌面快捷方式全部使用小方图标时，请在 Windows 中执行安装器构建命令。

## 在 Windows 生成单文件安装器

在 Windows x64 电脑中运行：

```bash
npm install
npm run package:win:installer
```

安装器输出到 `release/installer/`，安装时会自动创建桌面快捷方式。
