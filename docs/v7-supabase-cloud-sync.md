# V7：Supabase 真实云端同步

V7 的学习主题是：真实云端同步。

这一版不再做模拟云。它接入 Supabase，让项目具备真实的云端账号、数据库表和上传/下载词条能力。

## 这一版学习什么

- `Supabase`：云数据库、认证和 API 服务。
- `Auth`：真实云端账号，用户用邮箱和密码登录。
- `Database table`：数据库表，用来保存每个用户的词条备份。
- `API`：前端通过 Supabase 客户端和云端通信。
- `RLS`：Row Level Security，控制用户只能读写自己的数据。
- `publishable / anon key`：可以放前端的公开 key。
- `service_role / secret key`：服务端最高权限 key，不能放前端，也不要提交到 GitHub。

## 你需要在 Supabase 做什么

1. 注册或登录 Supabase。
2. 创建一个 project。
3. 打开 SQL Editor。
4. 执行 `docs/v7-supabase-schema.sql`。
5. 打开 Project Settings / API Keys。
6. 复制：
   - Project URL
   - Publishable key 或 legacy anon key
7. 填入 `scripts/supabaseConfig.js`。

示例：

```js
export const SUPABASE_CONFIG = {
  url: "https://你的项目.supabase.co",
  publishableKey: "你的 publishable 或 anon key"
};
```

不要填写 `service_role` 或 `secret` key。

## V7 数据流

```text
本地词条
  -> 点击“上传到云端”
  -> Supabase term_backups 表
  -> 换设备后登录同一云端账号
  -> 点击“从云端恢复”
  -> 写回本地词条
```

## 真实产品限制

V7 是真实云同步的最小版，但还不是完整商业同步系统：

- 目前是手动上传/下载，不是自动实时同步；
- 冲突策略是手动覆盖，不做复杂合并；
- 还没有团队空间；
- 还没有管理员权限；
- 还没有审计日志和回滚。

这些会在后续版本继续学习。
