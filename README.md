# AI 学习词典

这是一个给编程新手使用的小词典网页，用来学习 GitHub、Git、CLI 和 AI 编程里的常见词。

V4 已经从“可以编辑词条的网页”升级成“可以安装、离线使用、导入导出备份的轻量应用”。

## V4 功能

- 查看默认学习词汇卡片
- 按关键词搜索
- 按分类筛选
- 按学习状态筛选：`不会`、`在学`、`已会`
- 新增自定义词条
- 编辑已有词条
- 删除词条
- 修改每个词条的学习状态
- 刷新浏览器后保留词条和学习状态
- 一键重置回默认词库
- 导出 JSON 备份
- 导入 JSON 备份
- 支持安装到桌面
- 支持离线打开已缓存的应用

## 普通用户怎么使用

打开在线地址：

```text
https://drovecoding.github.io/ai-work-dictionary/
```

普通用户不需要安装 GitHub、Git、Codex、Python，也不需要打开命令行。

第一次联网打开后，浏览器可能会出现“安装”按钮。安装后，它会像普通应用一样出现在桌面或开始菜单里。

## 如何备份和恢复

点击：

```text
导出备份
```

会下载一个 `.json` 文件。这个文件保存了当前词条和学习状态。

换电脑或换浏览器时，点击：

```text
导入备份
```

选择之前导出的 `.json` 文件，就可以恢复数据。

## 开发者如何本地打开

推荐用本地服务器打开，因为 V2 使用了 JavaScript 模块。

在项目目录运行：

```bash
python -m http.server 8000
```

然后在浏览器打开：

```text
http://localhost:8000
```

线上版本可以通过 GitHub Pages 访问。

## 文件 / 模块中文用途表

| 文件 / 模块 | 中文用途 | 新手理解 |
|---|---|---|
| `index.html` | 页面结构 | 决定页面上有哪些区域，比如标题、表单、筛选按钮、词条列表 |
| `style.css` | 页面样式 | 决定页面长什么样，比如颜色、间距、卡片、按钮、手机适配 |
| `scripts/data.js` | 默认词库 | 存放初始 20 个词条，以及分类和学习状态的中文名称 |
| `scripts/auth.js` | 本地模拟登录 | 保存当前用户 session，用来学习账号登录的基本概念 |
| `scripts/cloudSync.js` | 云端同步逻辑 | 负责注册、登录、上传词条、下载词条 |
| `scripts/permissions.js` | 权限逻辑 | 读取角色、判断管理员、读取/发布公共词库 |
| `scripts/organizations.js` | 组织和工作区逻辑 | 负责创建组织、读取我的组织、判断组织里的角色 |
| `scripts/supabaseClient.js` | Supabase 客户端 | 用项目 URL 和 publishable key 连接真实云服务 |
| `scripts/supabaseConfig.js` | Supabase 配置 | 填写 Supabase 项目 URL 和公开 key；不要放 secret key |
| `scripts/version.js` | 版本检查逻辑 | 比较当前版本和最新版本，读取 `version.json` |
| `scripts/storage.js` | 本地保存 | 像浏览器里的小本子，负责保存和读取词条 |
| `scripts/filters.js` | 筛选逻辑 | 决定哪些词条应该显示，处理搜索、分类、学习状态 |
| `scripts/render.js` | 页面渲染 | 把数据变成看得见的词条卡片 |
| `scripts/termActions.js` | 词条编辑逻辑 | 负责更新词条内容，同时保留学习状态和身份编号 |
| `scripts/app.js` | 应用启动和事件 | 把按钮、表单、编辑模式、备份导入导出、数据和页面连接起来 |
| `manifest.json` | 安装配置 | 告诉浏览器这个网页可以像应用一样安装 |
| `service-worker.js` | 离线缓存 | 保存网页外壳，让应用在断网时也能打开 |
| `icons/icon.svg` | 应用图标 | 安装到桌面时显示的图标 |
| `tests/logic.test.mjs` | 逻辑测试 | 用命令检查默认词库、筛选和本地保存是否正常 |

## localStorage 是什么

`localStorage` 可以理解成浏览器给网页准备的一个“小本子”。

这个项目会把你新增的词条、删除结果、学习状态保存到这个小本子里。这样刷新页面后，数据还在。

注意：它不是云端数据库，只保存在当前浏览器里。换电脑、换浏览器，数据不会自动同步。

所以 V4 增加了导入导出备份。备份文件可以帮助你把数据从一个浏览器带到另一个浏览器。

## 编辑词条怎么工作

点击词条卡片上的 `编辑` 按钮后，页面上方的表单会进入编辑模式。

编辑模式会：

- 把原词条内容填入表单
- 把提交按钮改成 `保存修改`
- 显示 `取消编辑`
- 保存后更新原词条，而不是新建一张卡片
- 保留原来的学习状态，比如 `已会` 不会因为编辑而丢失

点击 `重置默认词库` 会恢复默认 20 个词条，并清空你做过的自定义新增和编辑。

## 这个项目用来学习什么

- `HTML`：网页骨架
- `CSS`：网页外观
- `JavaScript`：网页交互
- `JavaScript modules`：把复杂逻辑拆成多个模块
- `localStorage`：浏览器本地保存
- `PWA`：让网页具备安装和离线能力
- `Git`：记录每次修改
- `GitHub`：上传和展示项目
- `GitHub Pages`：把网页发布成可访问的网址

## V5 桌面版学习

V5 新增 Electron 桌面壳。详细学习说明在：

```text
docs/v5-electron-desktop.md
```

V5 新增的桌面相关文件：

| 文件 / 模块 | 中文用途 | 新手理解 |
|---|---|---|
| `package.json` | npm 项目配置 | 记录测试、启动桌面版、打包桌面版这些命令。 |
| `package-lock.json` | 依赖锁定文件 | 固定工具版本，让另一台电脑安装到同一批依赖。 |
| `desktop/main.cjs` | Electron 主进程入口 | 创建桌面窗口，并加载现有网页 `index.html`。 |
| `.github/workflows/desktop-build.yml` | 云端桌面构建流程 | 当本地下载 Electron 太慢时，让 GitHub 在云端打包 Windows 便携版。 |
| `docs/v5-electron-desktop.md` | V5 学习说明 | 解释 Electron、打包、构建产物和真实产品限制。 |

## V6A 本地模拟登录

V6A 新增“本地学习账号”。它的目标不是做真实商业登录，而是先学习账号系统的几个基础概念：

- `user`：当前是谁在使用应用；
- `session`：浏览器记住“当前已进入哪个用户”的状态；
- `logout`：退出当前 session；
- `data isolation`：不同用户使用不同的本地词条保存位置。

注意：V6A 没有密码、没有服务器、没有数据库，不适合作为真实客户账号系统。真实登录会在后续版本继续学习。

V6A 新增文件：

| 文件 / 模块 | 中文用途 | 新手理解 |
|---|---|---|
| `scripts/auth.js` | 本地模拟登录模块 | 负责创建本地用户、保存 session、退出登录 |
| `docs/v6a-local-auth.md` | V6A 学习说明 | 解释本地模拟登录和真实登录的区别 |

## V7 Supabase 云端同步

V7 接入 Supabase，学习真实云端账号、数据库表、API 和 RLS 权限规则。

V7 新增文件：

| 文件 / 模块 | 中文用途 | 新手理解 |
|---|---|---|
| `scripts/cloudSync.js` | 云端同步逻辑 | 把本地词条上传到 Supabase，或从 Supabase 下载回来 |
| `scripts/supabaseClient.js` | Supabase 客户端 | 负责创建和 Supabase 通信的客户端 |
| `scripts/supabaseConfig.js` | Supabase 配置 | 填写项目 URL 和 publishable/anon key |
| `docs/v7-supabase-cloud-sync.md` | V7 学习说明 | 解释真实云同步、Auth、数据库、RLS 和 key 的区别 |
| `docs/v7-supabase-schema.sql` | 数据库建表 SQL | 在 Supabase SQL Editor 中执行，创建云端词条备份表和权限规则 |

注意：`publishable key` 或 legacy `anon key` 可以用于前端；`service_role` / `secret key` 不能放进前端，也不要提交到 GitHub。

## V8 版本发布系统

V8 新增“版本与更新”区域，用来学习一个产品如何发布、检查更新、记录变化和准备回滚。

V8 新增文件：

| 文件 / 模块 | 中文用途 | 新手理解 |
|---|---|---|
| `version.json` | 最新版本信息 | 应用检查更新时读取的版本说明 |
| `CHANGELOG.md` | 更新日志 | 按版本记录每次发布改了什么 |
| `scripts/version.js` | 版本检查逻辑 | 比较当前版本和最新版本 |
| `docs/v8-release-system.md` | V8 学习说明 | 解释 release、artifact、changelog、回滚和发布检查清单 |

## V9A 登录入口和身份边界

V9A 把登录入口从首页工具区独立出来。打开应用后，用户先选择：

- 登录云端账号；
- 注册云端账号；
- 使用访客模式。

进入主应用后，顶部会显示当前身份。这样后续做管理员、普通用户、公共词库和权限规则时，身份边界会更清楚。

V9A 新增文件：

| 文件 / 模块 | 中文用途 | 新手理解 |
|---|---|---|
| `docs/v9a-auth-entry.md` | V9A 学习说明 | 解释为什么权限系统前要先整理登录入口 |

## V9B 权限系统

V9B 新增角色和公共词库：

- 普通用户可以读取公共词库；
- 管理员可以发布当前词条为公共词库；
- 真正的权限限制写在 Supabase RLS 里，不只靠前端按钮。

V9B 新增文件：

| 文件 / 模块 | 中文用途 | 新手理解 |
|---|---|---|
| `scripts/permissions.js` | 权限和公共词库逻辑 | 判断当前用户是不是管理员，并和 Supabase 公共词库表通信 |
| `docs/v9b-permissions-schema.sql` | 权限数据库 SQL | 在 Supabase 中创建 `profiles`、`public_terms`、RLS 策略 |
| `docs/v9b-permissions.md` | V9B 学习说明 | 解释 RBAC、RLS、管理员和普通用户 |

## V10A 组织和工作区

V10A 开始学习 SaaS 里的 `organization / workspace` 模型。账号代表“一个人”，组织代表“一个团队、公司或客户空间”。

这一版新增：

- 登录用户可以创建组织；
- 创建者会自动成为组织拥有者；
- 页面可以读取并选择“我的组织”；
- 真正的成员关系和读取权限写在 Supabase RLS 里。

V10A 新增文件：

| 文件 / 模块 | 中文用途 | 新手理解 |
|---|---|---|
| `scripts/organizations.js` | 组织和工作区逻辑 | 把“创建组织、读取我的组织、角色名称”这些组织相关代码集中放在一起 |
| `docs/v10a-organizations-schema.sql` | 组织数据库 SQL | 在 Supabase 中创建 `organizations`、`organization_memberships`、RLS 策略和自动加入组织的触发器 |
| `docs/v10a-organizations.md` | V10A 学习说明 | 解释 SaaS 为什么需要组织、成员关系和多租户隔离 |

注意：V10A 先建立组织模型，还没有把词条数据真正迁移成“每个组织一套词库”。这会放到后续版本学习。

## V10B 组织级词库隔离

V10B 让词条数据开始真正属于组织。选择不同组织后，本地显示的是不同组织的词库缓存；上传/下载云端时，也会操作当前组织的词库。

如果没有选择组织，原来的个人云端同步仍然保留。

V10B 新增文件：

| 文件 / 模块 | 中文用途 | 新手理解 |
|---|---|---|
| `docs/v10b-organization-terms-schema.sql` | 组织词库数据库 SQL | 创建 `organization_term_backups`，让每个组织有自己的云端词库备份 |
| `docs/v10b-organization-terms.md` | V10B 学习说明 | 解释 `organization_id`、多租户隔离和 RLS 为什么重要 |

## V10C 组织成员邀请

V10C 让组织 owner 可以按邮箱添加已注册用户为成员，并在页面里查看当前组织成员列表。

这一版先不做邮件邀请链接，而是学习最核心的成员权限模型：谁有权把谁加入哪个组织。

V10C 新增文件：

| 文件 / 模块 | 中文用途 | 新手理解 |
|---|---|---|
| `docs/v10c-member-invites-schema.sql` | 组织成员数据库 SQL | 创建添加成员和读取成员列表的数据库函数，真正检查 owner 权限 |
| `docs/v10c-member-invites.md` | V10C 学习说明 | 解释成员关系、owner 权限和为什么先不做邮件邀请链接 |

## V10D 成员管理和角色变更

V10D 让组织 owner 可以管理已有成员：把普通成员升级为拥有者，或把普通成员移出组织。

这一版重点学习危险操作保护：权限判断必须写在数据库函数里，不能只靠前端隐藏按钮。

V10D 新增文件：

| 文件 / 模块 | 中文用途 | 新手理解 |
|---|---|---|
| `docs/v10d-member-management-schema.sql` | 成员管理数据库 SQL | 创建升级成员和移除成员的数据库函数，保护 owner 权限 |
| `docs/v10d-member-management.md` | V10D 学习说明 | 解释角色变更、移除成员、最后 owner 保护这些真实 SaaS 问题 |
