# V11A：GitHub Actions Node 24 维护

V11A 的学习主题是：CI/CD 运行环境维护。

前几次 GitHub Pages 部署成功了，但 Actions 给出提示：部分 JavaScript action 仍运行在 Node.js 20，而 GitHub 会逐步切换到 Node.js 24。

## 这一版做什么

- 更新 `.github/workflows/pages.yml`。
- 增加 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true`。
- 让 GitHub Actions 里的 JavaScript action 提前使用 Node 24。
- 保持原有 Pages 部署流程不变。

## 关键概念

- `CI/CD`：自动检查、自动构建、自动部署的流程。
- `workflow`：GitHub Actions 的配置文件。
- `runner`：GitHub 用来执行 workflow 的机器环境。
- `deprecated`：旧版本即将不推荐或不可用。
- `maintenance task`：维护任务，不是新功能，但会影响长期稳定性。

## 为什么重要

真实项目不是“上线一次就结束”。依赖、运行环境、构建工具都会更新。

如果长期忽略这类提醒，未来可能发生：

```text
今天只是警告
几个月后变成失败
部署突然不能用了
```

所以工程维护的核心是：在警告还只是警告时处理它。

## 如何验证

合并 PR 后，GitHub Pages 会重新部署。

进入 GitHub Actions，查看最新的 `Deploy GitHub Pages` 运行记录：

- 部署应成功；
- Node.js 20 actions deprecated 警告应消失或减少；
- 线上页面仍能打开。
