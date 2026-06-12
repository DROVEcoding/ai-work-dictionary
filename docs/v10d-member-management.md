# V10D：成员管理和角色变更

V10D 的学习主题是：权限系统里的危险操作保护。

V10C 可以把成员加入组织。V10D 开始管理已有成员：升级成员、移除成员，并把真正的权限判断放在数据库函数里。

## 这一版做什么

- 组织 owner 可以把普通 member 升级为 owner。
- 组织 owner 可以把普通 member 移出组织。
- 普通 member 不能管理其他成员。
- 当前用户不能移除自己。
- 当前版本不能移除 owner，避免误删最后管理者。

## 为什么重要

真实 SaaS 的成员管理很容易出事故：

```text
误删最后一个 owner -> 整个组织没人能管理
前端隐藏按钮但后端没检查 -> 普通成员也可能调用接口管理别人
角色变更没有确认 -> 一次误点造成权限事故
```

所以这类动作必须在数据库函数或后端 API 中再次检查。

## 关键概念

- `role change`：角色变更，比如 member 升级为 owner。
- `dangerous action`：危险操作，比如移除成员、改变权限。
- `backend authorization`：后端权限校验，不能只靠前端按钮。
- `last owner protection`：最后一个 owner 保护，避免组织失去管理员。

## 你需要做什么

在 Supabase SQL Editor 执行：

```text
docs/v10d-member-management-schema.sql
```

执行成功后：

1. 用 owner 账号登录。
2. 选择一个有 member 的组织。
3. 在成员列表里把普通 member 升级为 owner。
4. 再添加一个普通 member，测试移除普通 member。
5. 用 member 账号登录时，确认看不到管理按钮。

## 真实 SaaS 还差什么

V10D 还没有做 owner 降级，因为这需要更细的保护：

- 至少保留一个 owner；
- 不能把自己降级成最后一个非 owner；
- 操作前可能需要二次确认；
- 最好写审计日志，记录谁改了谁的角色。
