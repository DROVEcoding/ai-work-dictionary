# V8：版本发布系统

V8 的学习主题是：Release System。

真实产品不是“写完就结束”。每次上线都需要版本号、更新说明、发布入口、回滚方案和上线检查。

## 这一版学习什么

- `version`：版本号，例如 `1.3.0`。
- `CHANGELOG`：更新日志，告诉用户和维护者每个版本改了什么。
- `GitHub Release`：正式发布页，适合放安装包、桌面版下载和版本说明。
- `artifact`：GitHub Actions 的临时构建产物，适合测试，不等于正式 release。
- `update check`：应用读取 `version.json`，判断自己是不是最新。
- `rollback`：如果新版本坏了，可以回到旧版本。
- `release checklist`：上线前检查清单。

## V8 做了什么

- 新增 `version.json` 保存最新版本信息。
- 新增 `CHANGELOG.md` 记录版本变化。
- 新增 `scripts/version.js` 处理版本比较和读取最新版本。
- 页面新增“版本与更新”区域。
- service worker 升级到 V8 缓存。

## Web 和桌面版更新的区别

Web 版更新：

```text
部署新文件 -> 用户刷新页面 -> 看到新版本
```

桌面版更新：

```text
构建安装包 -> 创建 GitHub Release -> 用户下载新版
```

真正自动更新桌面版还需要更多配置，通常涉及签名、更新源和版本兼容，后续版本再学。

## 发布检查清单

每次正式发布前至少检查：

- 测试是否通过；
- README 是否更新；
- CHANGELOG 是否记录；
- `version.json` 版本号是否正确；
- GitHub Pages 是否部署成功；
- 桌面构建 artifact 是否可下载；
- 是否需要创建 GitHub Release；
- 如果出问题，能否回滚到上一个版本。
