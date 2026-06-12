# V11C：分支保护和必过检查

V11C 的学习主题是：保护主分支。

V11B 已经让 GitHub 在 PR 和 main 推送时自动运行测试。V11C 把测试变成 `main` 分支的必过检查。

## 这一版做什么

- 给 GitHub 仓库的 `main` 分支启用 branch protection。
- 设置 required status check：`test`。
- 开启 strict mode，让 PR 分支必须和最新 main 保持同步后再合并。
- 保持管理员可绕过，方便学习项目遇到紧急情况时还能处理。

## 关键概念

- `branch protection`：分支保护，限制重要分支不能随便改。
- `required status check`：必过检查，指定某个自动检查必须通过。
- `strict mode`：要求 PR 基于最新 main 重新检查。
- `main branch`：项目主线，通常代表线上或即将上线的版本。

## 为什么重要

没有分支保护时，即使测试失败，PR 也可能被合并。

有了 required check 后，流程变成：

```text
开 PR -> GitHub 自动测试 -> 测试通过 -> 才能合并
```

这就是团队项目里的基础质量门禁。

## 这次设置

通过 GitHub API 设置：

```text
required status check: test
strict: true
```

以后如果 `test` 没通过，GitHub 会阻止普通合并流程。
