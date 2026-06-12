# V10A：组织和工作区

V10A 的学习主题是：SaaS 的组织模型。

个人工具只需要“用户”。SaaS 产品通常还需要“组织 / 工作区”，因为客户往往不是一个人，而是一个团队、公司、班级或项目组。

## 这一版做什么

- 新增 `organizations` 表。
- 新增 `organization_memberships` 表。
- 登录用户可以创建组织。
- 创建者自动成为组织 owner。
- 页面可以读取并选择“我的组织”。
- 新增 `组织 / 工作区` 面板，作为后续团队词库、邀请成员、套餐计费的入口。

## 关键概念

- `organization`：组织，一个客户空间。
- `workspace`：工作区，通常和 organization 类似，表示一组共享数据。
- `membership`：成员关系，记录谁属于哪个组织。
- `owner`：拥有者，可以管理组织。
- `member`：普通成员。
- `multi-tenant`：多租户，不同组织的数据要隔离。

## 为什么重要

V9 只有“全站管理员”和“普通用户”。V10 开始进入真正 SaaS：

```text
一个用户可以属于多个组织
每个组织有自己的成员
每个组织未来会有自己的公共词库
```

V10A 只做组织模型，邀请成员和组织公共词库放到后续版本。

## 你需要做什么

我可以写代码和 SQL 文件，但 Supabase 数据库在你的账号里，所以这一步需要你手动打开 Supabase 的 SQL Editor，执行：

```text
docs/v10a-organizations-schema.sql
```

执行成功后，回到页面登录云端账号，输入组织名称，点击 `创建组织`。

如果看到 `new row violates row-level security policy for table "organizations"`，通常说明前端直接插入组织表时被 RLS 拦住。最新版已经改成调用数据库函数 `create_organization()`，重新执行最新版 `docs/v10a-organizations-schema.sql`，再刷新页面重试。

## 我做了什么

- 在前端加了组织面板。
- 把组织相关代码放进 `scripts/organizations.js`，避免继续塞进 `app.js`。
- 写了 Supabase SQL，让数据库知道什么是组织、什么是成员、什么是拥有者。
- 用 RLS 限制：用户只能读取自己加入的组织。
- 用数据库触发器自动写入 `created_by`，避免前端伪造或漏传创建者。
- 用 `create_organization()` 数据库函数包住“创建组织 + 创建 owner 成员关系”，避免前端直接写多张表。
- 写了测试，验证拥有者和成员的角色判断。

## 真实 SaaS 还差什么

V10A 是组织模型的地基，还不是完整团队 SaaS。后面通常还需要：

- 邀请成员加入组织；
- 把词条表加上 `organization_id`，让不同组织的数据真正隔离；
- 组织级管理员权限；
- 计费套餐和使用额度；
- 审计日志，记录谁改了什么。
