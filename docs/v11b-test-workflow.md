# V11B：GitHub Actions 自动测试

V11B 的学习主题是：CI 自动测试。

以前我们每次改完代码，主要由本地执行：

```bash
npm test
```

这很好，但真实团队项目不能只依赖某个人本地有没有跑测试。GitHub 也应该在 PR 和 main 推送时自动跑测试。

## 这一版做什么

- 新增 `.github/workflows/test.yml`。
- 在 `pull_request` 时自动跑测试。
- 在推送到 `main` 时自动跑测试。
- 使用 Node.js 24。
- 执行 `npm ci` 和 `npm test`。

## 关键概念

- `CI`：持续集成，每次代码变化都自动检查。
- `workflow`：GitHub Actions 的自动化配置文件。
- `pull_request check`：PR 合并前的自动检查。
- `npm ci`：按 `package-lock.json` 安装依赖，更适合 CI。
- `npm test`：执行项目测试。

## 为什么重要

本地测试通过，只能说明“这一台电脑上刚刚通过”。

CI 自动测试的价值是：

```text
每次 PR 都检查
每次 main 更新都检查
任何人改代码都要经过同一套机器验证
```

后续还可以把它设置成 required check，让测试不通过的 PR 不能合并。

## 如何验证

创建 PR 后，GitHub 会自动出现 `Run Tests` 检查。

检查通过说明：

- 依赖能在 GitHub 机器上安装；
- 测试能在 GitHub 机器上运行；
- 当前代码至少没有破坏已有自动测试。
