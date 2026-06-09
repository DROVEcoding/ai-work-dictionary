# AI 学习词典 V2 管理版实施计划

> **给 AI 工作者的要求：** 实施时按任务逐步执行。每个任务完成后做验证，能独立提交就单独提交。文档和解释使用中文；代码文件名、变量名、函数名保持英文通用习惯；关键逻辑加简短中文注释。

**目标：** 把 AI 学习词典升级成可新增、删除、标记学习状态、筛选状态、保存到浏览器并可重置的学习应用。

**架构：** V2 把原来的单个 `script.js` 拆成多个 JavaScript 模块。`data.js` 管默认数据，`storage.js` 管本地保存，`filters.js` 管筛选，`render.js` 管页面渲染，`app.js` 管状态和事件。

**技术栈：** HTML、CSS、原生 JavaScript 模块、localStorage、Git、GitHub Pages。

---

## 文件变更总览

会新增：

- `scripts/data.js`
- `scripts/storage.js`
- `scripts/filters.js`
- `scripts/render.js`
- `scripts/app.js`

会修改：

- `index.html`
- `style.css`
- `README.md`

会删除：

- `script.js`

## 任务 1：建立模块化脚本结构

**文件：**

- 新增：`scripts/data.js`
- 新增：`scripts/storage.js`
- 新增：`scripts/filters.js`
- 新增：`scripts/render.js`
- 新增：`scripts/app.js`
- 修改：`index.html`
- 删除：`script.js`

**步骤：**

- [ ] 创建 `scripts/` 文件夹。
- [ ] 把 V1 默认词条迁移到 `scripts/data.js`，每个词条补充 `id`、`status`、`isDefault`。
- [ ] 创建空的 `storage.js`、`filters.js`、`render.js`、`app.js`，先放清晰的导出函数骨架。
- [ ] 修改 `index.html`，把旧的 `<script src="script.js"></script>` 改成 `<script type="module" src="scripts/app.js"></script>`。
- [ ] 删除旧 `script.js`。
- [ ] 打开本地 `index.html`，确认页面不会因为脚本路径错误而完全空白。
- [ ] 提交：`Refactor JavaScript into modules`

**验证重点：**

- `index.html` 不再引用 `script.js`。
- `scripts/app.js` 能被浏览器加载。

## 任务 2：实现默认词条渲染

**文件：**

- 修改：`scripts/render.js`
- 修改：`scripts/app.js`
- 修改：`style.css`

**步骤：**

- [ ] 在 `render.js` 中实现卡片渲染函数。
- [ ] 在 `app.js` 中加载默认词条并调用渲染函数。
- [ ] 给卡片增加学习状态展示区域。
- [ ] 在 `style.css` 中添加学习状态标签的基础样式。
- [ ] 打开本地页面，确认默认 20 个词条正常显示。
- [ ] 提交：`Render default terms from modules`

**验证重点：**

- 默认词条数量仍然是 20。
- 卡片仍然显示词、分类、解释、解决的问题。
- 卡片新增学习状态，默认是 `不会`。

## 任务 3：实现搜索、分类和学习状态筛选

**文件：**

- 修改：`index.html`
- 修改：`scripts/filters.js`
- 修改：`scripts/render.js`
- 修改：`scripts/app.js`
- 修改：`style.css`

**步骤：**

- [ ] 在 `index.html` 中新增学习状态筛选按钮：`全部状态`、`不会`、`在学`、`已会`。
- [ ] 在 `filters.js` 中实现组合筛选：搜索关键词 + 分类 + 学习状态。
- [ ] 在 `app.js` 中保存当前分类、当前学习状态、当前搜索词。
- [ ] 绑定搜索框、分类按钮、状态按钮事件。
- [ ] 在 `style.css` 中添加状态筛选按钮样式。
- [ ] 手动测试组合筛选。
- [ ] 提交：`Add learning status filters`

**验证重点：**

- 搜索 `CLI` 能找到 CLI。
- 分类 `AI 编程` 只显示 AI 词条。
- 状态 `不会` 显示默认未掌握词条。
- 搜索、分类、状态三个条件能同时生效。

## 任务 4：实现学习状态切换和 localStorage 保存

**文件：**

- 修改：`scripts/storage.js`
- 修改：`scripts/render.js`
- 修改：`scripts/app.js`

**步骤：**

- [ ] 在 `storage.js` 中实现读取、保存、重置函数。
- [ ] 页面启动时优先读取 `localStorage`，无有效保存时使用默认词库。
- [ ] 在每张卡片上增加状态切换按钮。
- [ ] 点击 `不会`、`在学`、`已会` 后更新词条状态。
- [ ] 每次状态变化后保存到 `localStorage` 并重新渲染。
- [ ] 刷新浏览器，确认状态保留。
- [ ] 提交：`Persist learning status locally`

**验证重点：**

- 把一个词条标成 `已会` 后刷新，状态仍然是 `已会`。
- localStorage 数据损坏或为空时，页面能回到默认词库。

## 任务 5：实现新增词条

**文件：**

- 修改：`index.html`
- 修改：`scripts/app.js`
- 修改：`style.css`

**步骤：**

- [ ] 在 `index.html` 中新增词条表单：词条名、分类、解释、解决的问题。
- [ ] 在 `app.js` 中处理表单提交。
- [ ] 表单缺少必填项时显示中文提示。
- [ ] 新增词条时生成稳定 `id`，设置 `status: "unknown"` 和 `isDefault: false`。
- [ ] 新增后保存到 `localStorage`，清空表单，并重新渲染。
- [ ] 刷新浏览器，确认新增词条还在。
- [ ] 提交：`Add custom term creation`

**验证重点：**

- 表单为空时不会新增。
- 填完整后能新增词条。
- 新增词条刷新后仍然存在。

## 任务 6：实现删除和重置默认词库

**文件：**

- 修改：`index.html`
- 修改：`scripts/render.js`
- 修改：`scripts/app.js`
- 修改：`style.css`

**步骤：**

- [ ] 在每张卡片上增加 `删除` 按钮。
- [ ] 点击删除后从当前词条列表移除该词条。
- [ ] 删除后保存到 `localStorage` 并重新渲染。
- [ ] 在页面上增加 `重置默认词库` 按钮。
- [ ] 点击重置后恢复默认词条并保存。
- [ ] 手动验证删除和重置。
- [ ] 提交：`Add delete and reset actions`

**验证重点：**

- 删除词条后刷新，词条仍然消失。
- 点击重置后恢复默认 20 个词条。

## 任务 7：更新 README 中文结构说明

**文件：**

- 修改：`README.md`

**步骤：**

- [ ] 更新第一版功能为 V2 功能。
- [ ] 增加“文件 / 模块中文用途表”。
- [ ] 解释 `localStorage` 是什么。
- [ ] 说明如何本地打开和如何上线到 GitHub Pages。
- [ ] 提交：`Update README for V2`

**README 必须包含这个表格类型：**

```markdown
| 文件 / 模块 | 中文用途 | 新手理解 |
|---|---|---|
| `index.html` | 页面结构 | 决定页面上有哪些区域 |
| `style.css` | 页面样式 | 决定页面长什么样 |
| `scripts/data.js` | 默认词库 | 存放初始 20 个词条 |
| `scripts/storage.js` | 本地保存 | 像浏览器里的小本子，负责保存和读取词条 |
| `scripts/filters.js` | 筛选逻辑 | 决定哪些词条应该显示 |
| `scripts/render.js` | 页面渲染 | 把数据变成看得见的卡片 |
| `scripts/app.js` | 应用启动和事件 | 把按钮、表单、数据和页面连接起来 |
```

## 任务 8：最终验证、推送和线上检查

**文件：**

- 不一定修改文件。

**步骤：**

- [ ] 本地打开 `index.html`。
- [ ] 验证默认词条显示。
- [ ] 验证新增词条。
- [ ] 验证刷新后新增词条保留。
- [ ] 验证学习状态切换。
- [ ] 验证刷新后学习状态保留。
- [ ] 验证搜索 + 分类 + 状态组合筛选。
- [ ] 验证删除。
- [ ] 验证重置默认词库。
- [ ] 运行脚本或命令检查：`index.html` 不引用 `script.js`，并引用 `scripts/app.js`。
- [ ] 确认 `git status --short` 干净。
- [ ] `git push` 到 GitHub。
- [ ] 打开 GitHub Pages 地址确认线上页面更新。

## 自检清单

- V2 设计里的新增、删除、状态、状态筛选、localStorage、重置默认词库都有对应任务。
- 模块化要求有对应文件拆分。
- README 中文用途表已纳入任务。
- 文档使用中文，代码命名保持英文。
- 计划没有要求引入框架或后端。
