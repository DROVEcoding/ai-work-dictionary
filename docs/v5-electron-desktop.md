# V5：Electron 桌面版

V5 的学习主题是：桌面应用打包。

当前项目本质上是一个网页应用。Electron 会在外面加一层桌面壳，让同一个 `index.html` 可以在 Windows 桌面窗口里运行。这样我们不用重写词典界面，也能学习“网页如何变成桌面软件”。

## 这一版学习什么

- `npm`：管理开发工具和命令的工具。
- `package.json`：Node/npm 项目的说明书，记录项目名称、版本、命令和依赖。
- `Electron`：桌面应用框架，把网页放进一个自带 Chromium 的桌面窗口。
- `main process`：Electron 的主进程，负责创建窗口、控制桌面程序生命周期。
- `portable app`：便携版应用，不一定需要传统安装流程，下载后可以运行。
- `artifact`：构建产物，比如 GitHub Actions 生成的桌面应用压缩包。

## 学习版和真实产品的区别

这一版是学习版：

- 创建 Electron 桌面壳。
- 复用现有网页界面。
- 可以继续用 `npm test` 跑原有逻辑测试。
- 可以通过 GitHub Actions 在云端构建 Windows 便携版。

真实商业桌面分发通常还需要：

- 代码签名证书；
- 安装包样式和安装路径设计；
- 自动更新；
- Windows 安全信誉积累；
- 崩溃日志和错误上报；
- 客户支持、版本回滚和问题排查流程。

这些不是 V5 一次性完成的内容，后面版本会逐步学习。

## 本地命令

安装依赖：

```bash
npm install
```

运行网页逻辑测试：

```bash
npm test
```

Electron 运行时下载完成后，启动桌面版：

```bash
npm run desktop
```

本地构建 Windows 便携版：

```bash
npm run dist
```

## 当前环境说明

Electron 需要下载一个大约 148 MB 的 Windows 运行时压缩包。在当前电脑网络下，本地下载超时，所以 V5 也加入了 GitHub Actions 云端构建流程：

```text
.github/workflows/desktop-build.yml
```

这个流程让 GitHub 在云端构建 Windows 便携版，并把结果作为 artifact 提供下载。
