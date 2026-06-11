# V9B：权限系统

V9B 的学习主题是：RBAC 和 RLS。

`RBAC` 是 Role-Based Access Control，意思是“按角色控制权限”。`RLS` 是 Row Level Security，意思是数据库按行判断谁能读写。

## 这一版做什么

- 新增 `profiles` 表，保存用户角色。
- 新增 `public_terms` 表，保存公共词库。
- 普通用户可以读取公共词库。
- 管理员可以把当前词条发布为公共词库。
- 前端显示当前账号角色。

## 你需要做什么

1. 在 Supabase SQL Editor 执行 `docs/v9b-permissions-schema.sql`。
2. 注册或登录你的云端账号。
3. 在 SQL Editor 执行最后那条管理员授权 SQL，把自己的邮箱设为 admin。

示例：

```sql
update public.profiles set role = 'admin' where email = '你的邮箱';
```

## 为什么这样协作

权限系统不能只靠前端按钮隐藏。前端可以改善体验，但真正安全必须在数据库 RLS 里限制。

这也是为什么你要在 Supabase 里执行 SQL：真实权限属于云端数据库，不属于浏览器页面。
