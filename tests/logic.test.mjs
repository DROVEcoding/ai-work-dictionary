import test from "node:test";
import assert from "node:assert/strict";

import { clearSession, createLocalUser, loadSession, saveSession } from "../scripts/auth.js";
import { createCloudBackupPayload, createOrganizationTermsPayload } from "../scripts/cloudSync.js";
import { createTerm, defaultTerms } from "../scripts/data.js";
import { filterTerms } from "../scripts/filters.js";
import { exportTermsBackup, getTermsStorageKey, importTermsBackup, loadTerms, loadTermsOrResetIfEmpty, saveTerms, resetTerms } from "../scripts/storage.js";
import { updateTermContent } from "../scripts/termActions.js";
import { compareVersions } from "../scripts/version.js";
import { canManagePublicTerms, createDefaultProfile, getRoleLabel } from "../scripts/permissions.js";
import { createFeedbackPayload, validateFeedbackMessage } from "../scripts/feedback.js";
import { canManageMember, canManageOrganization, getAuditEventLabel, getOrganizationRoleLabel, mapMyOrganizationRows, normalizeMemberEmail } from "../scripts/organizations.js";
import { filterAdminFeedbackReports, filterAdminOrganizations, filterAdminUsers, formatAdminFeedbackReports, formatAdminOrganizationDetail, formatAdminOrganizations, formatAdminOverview, formatAdminUsers, shouldLoadAdminData } from "../scripts/adminData.js";

function createFakeStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    }
  };
}

test("默认词库包含 20 个带学习状态的词条", () => {
  assert.equal(defaultTerms.length, 20);
  assert.ok(defaultTerms.every((term) => term.id && term.status === "unknown" && term.isDefault === true));
});

test("筛选逻辑可以同时处理搜索、分类和学习状态", () => {
  const terms = [
    { term: "CLI", category: "ai", categoryLabel: "AI 编程", definition: "命令行", solves: "自动化", status: "known" },
    { term: "Branch", category: "github", categoryLabel: "GitHub / Git", definition: "分支", solves: "隔离开发", status: "unknown" },
    { term: "MVP", category: "process", categoryLabel: "项目流程", definition: "最小可用产品", solves: "验证想法", status: "learning" }
  ];

  const result = filterTerms(terms, {
    query: "cli",
    category: "ai",
    status: "known"
  });

  assert.deepEqual(result.map((item) => item.term), ["CLI"]);
});

test("本地保存可以读取有效数据，并在数据损坏时回到默认词库", () => {
  const storage = createFakeStorage();
  const customTerm = createTerm({
    term: "localStorage",
    category: "ai",
    definition: "浏览器本地保存",
    solves: "刷新后保留数据"
  });

  saveTerms(storage, [customTerm]);
  assert.equal(loadTerms(storage, defaultTerms)[0].term, "localStorage");

  storage.setItem("ai-learning-dictionary-v2", "{bad json");
  assert.equal(loadTerms(storage, defaultTerms).length, defaultTerms.length);
});

test("重置会把保存内容恢复为默认词库", () => {
  const storage = createFakeStorage();
  resetTerms(storage, defaultTerms);

  const loaded = loadTerms(storage, []);
  assert.equal(loaded.length, 20);
  assert.equal(loaded[0].status, "unknown");
});

test("空的本地空间可以恢复默认词库", () => {
  const storage = createFakeStorage();
  saveTerms(storage, [], null);

  const restored = loadTermsOrResetIfEmpty(storage, defaultTerms, null);

  assert.equal(restored.length, 20);
  assert.equal(loadTerms(storage, [], null).length, 20);
});

test("编辑词条内容时保留原 id、学习状态和默认来源", () => {
  const original = {
    ...defaultTerms[0],
    status: "known"
  };

  const updated = updateTermContent([original], original.id, {
    term: "Git 版本管理",
    category: "github",
    definition: "记录代码历史。",
    solves: "解决改动可追踪的问题。"
  });

  assert.equal(updated[0].id, original.id);
  assert.equal(updated[0].status, "known");
  assert.equal(updated[0].isDefault, true);
  assert.equal(updated[0].term, "Git 版本管理");
  assert.equal(updated[0].definition, "记录代码历史。");
});

test("取消编辑时不改变原词条数据", () => {
  const original = defaultTerms[1];
  const termsBeforeCancel = [original];
  const termsAfterCancel = [...termsBeforeCancel];

  assert.deepEqual(termsAfterCancel, termsBeforeCancel);
});

test("可以把词条导出成带版本信息的 JSON 备份", () => {
  const backupText = exportTermsBackup(defaultTerms.slice(0, 1));
  const backup = JSON.parse(backupText);

  assert.equal(backup.app, "ai-work-dictionary");
  assert.equal(backup.version, 1);
  assert.equal(backup.terms.length, 1);
});

test("可以从有效备份导入词条，并拒绝坏格式", () => {
  const backupText = exportTermsBackup(defaultTerms.slice(0, 2));
  const imported = importTermsBackup(backupText);

  assert.equal(imported.ok, true);
  assert.equal(imported.terms.length, 2);

  const badImport = importTermsBackup("{ bad json");
  assert.equal(badImport.ok, false);
  assert.equal(badImport.terms, null);
});

test("本地模拟登录会创建可保存的用户 session", () => {
  const storage = createFakeStorage();
  const result = createLocalUser("  DROVE  ");

  assert.equal(result.ok, true);
  assert.equal(result.user.displayName, "DROVE");
  assert.equal(result.user.mode, "local-demo");

  saveSession(storage, result.user);
  assert.deepEqual(loadSession(storage), result.user);

  clearSession(storage);
  assert.equal(loadSession(storage), null);
});

test("无效用户名不会创建本地模拟用户", () => {
  const result = createLocalUser("A");

  assert.equal(result.ok, false);
  assert.equal(result.user, null);
});

test("不同本地用户使用不同的词条保存位置", () => {
  const storage = createFakeStorage();
  const alice = createLocalUser("Alice").user;
  const bob = createLocalUser("Bob").user;
  const aliceTerm = createTerm({
    term: "Session",
    category: "ai",
    definition: "登录状态。",
    solves: "记住当前用户。"
  });

  saveTerms(storage, [aliceTerm], alice.id);

  assert.equal(getTermsStorageKey(alice.id), "ai-learning-dictionary-v2:user:alice");
  assert.equal(loadTerms(storage, defaultTerms, alice.id)[0].term, "Session");
  assert.equal(loadTerms(storage, defaultTerms, bob.id).length, defaultTerms.length);
});

test("云端同步 payload 会带上用户 id、词条和更新时间", () => {
  const terms = defaultTerms.slice(0, 1);
  const payload = createCloudBackupPayload("user-123", terms);

  assert.equal(payload.owner_id, "user-123");
  assert.deepEqual(payload.terms, terms);
  assert.match(payload.updated_at, /^\d{4}-\d{2}-\d{2}T/);
});

test("组织词库 payload 会带上组织 id、更新者和词条", () => {
  const terms = defaultTerms.slice(0, 1);
  const payload = createOrganizationTermsPayload("org-123", "user-123", terms);

  assert.equal(payload.organization_id, "org-123");
  assert.equal(payload.updated_by, "user-123");
  assert.deepEqual(payload.terms, terms);
  assert.match(payload.updated_at, /^\d{4}-\d{2}-\d{2}T/);
});

test("版本比较可以判断当前、过期和开发版", () => {
  assert.equal(compareVersions("1.3.0", "1.3.0"), "current");
  assert.equal(compareVersions("1.2.0", "1.3.0"), "outdated");
  assert.equal(compareVersions("1.4.0", "1.3.0"), "ahead");
});

test("权限角色可以区分管理员和普通用户", () => {
  const user = { id: "user-1", email: "user@example.com" };
  const profile = createDefaultProfile(user);

  assert.equal(profile.role, "user");
  assert.equal(getRoleLabel("admin"), "管理员");
  assert.equal(canManagePublicTerms(profile), false);
  assert.equal(canManagePublicTerms({ ...profile, role: "admin" }), true);
});

test("组织角色可以区分拥有者和成员", () => {
  assert.equal(getOrganizationRoleLabel("owner"), "拥有者");
  assert.equal(getOrganizationRoleLabel("member"), "成员");
  assert.equal(canManageOrganization("owner"), true);
  assert.equal(canManageOrganization("member"), false);
});

test("我的组织只使用当前用户自己的成员角色", () => {
  const rows = [
    {
      user_id: "owner-1",
      role: "owner",
      organization: { id: "org-1", name: "Test Org", created_at: "2026-06-13T00:00:00.000Z" }
    },
    {
      user_id: "member-1",
      role: "member",
      organization: { id: "org-1", name: "Test Org", created_at: "2026-06-13T00:00:00.000Z" }
    }
  ];

  const organizations = mapMyOrganizationRows(rows, "member-1");

  assert.equal(organizations.length, 1);
  assert.equal(organizations[0].id, "org-1");
  assert.equal(organizations[0].role, "member");
});

test("成员邮箱会被标准化后再提交", () => {
  assert.equal(normalizeMemberEmail("  NewUser@Example.COM "), "newuser@example.com");
});

test("只有 owner 可以管理其他普通成员", () => {
  const member = { userId: "member-1", role: "member" };
  const owner = { userId: "owner-1", role: "owner" };

  assert.equal(canManageMember("owner", member, "owner-1"), true);
  assert.equal(canManageMember("member", member, "owner-1"), false);
  assert.equal(canManageMember("owner", member, "member-1"), false);
  assert.equal(canManageMember("owner", owner, "admin-1"), false);
});

test("审计日志事件类型可以显示为中文", () => {
  assert.equal(getAuditEventLabel("member_added"), "添加成员");
  assert.equal(getAuditEventLabel("member_promoted"), "升级成员");
  assert.equal(getAuditEventLabel("member_removed"), "移除成员");
  assert.equal(getAuditEventLabel("custom_event"), "custom_event");
});

test("反馈内容会校验长度并生成提交 payload", () => {
  assert.equal(validateFeedbackMessage("坏").ok, false);
  assert.equal(validateFeedbackMessage("这是一个有效反馈").ok, true);

  const payload = createFeedbackPayload({
    userId: "user-1",
    organizationId: "org-1",
    message: "  页面保存失败  ",
    pageUrl: "https://example.com/app",
    userAgent: "TestBrowser",
    appVersion: "1.0.0"
  });

  assert.equal(payload.reporter_id, "user-1");
  assert.equal(payload.organization_id, "org-1");
  assert.equal(payload.message, "页面保存失败");
  assert.equal(payload.page_url, "https://example.com/app");
  assert.equal(payload.user_agent, "TestBrowser");
  assert.equal(payload.app_version, "1.0.0");
});

test("后台总览数据会转换成稳定数字", () => {
  const overview = formatAdminOverview({
    user_count: 3,
    organization_count: 2,
    feedback_count: 5,
    open_feedback_count: 4
  });

  assert.deepEqual(overview, {
    userCount: 3,
    organizationCount: 2,
    feedbackCount: 5,
    openFeedbackCount: 4
  });
});

test("后台用户列表会保留平台角色和组织数量", () => {
  const users = formatAdminUsers([
    {
      id: "user-1",
      email: "admin@example.com",
      role: "admin",
      created_at: "2026-06-13T00:00:00.000Z",
      organization_count: 2
    }
  ]);

  assert.equal(users[0].id, "user-1");
  assert.equal(users[0].email, "admin@example.com");
  assert.equal(users[0].role, "admin");
  assert.equal(users[0].organizationCount, 2);
});

test("后台组织列表会展示拥有者和成员数量", () => {
  const organizations = formatAdminOrganizations([
    {
      id: "org-1",
      name: "客户成功组",
      created_at: "2026-06-13T00:00:00.000Z",
      owners: ["owner@example.com"],
      member_count: 4
    }
  ]);

  assert.equal(organizations[0].name, "客户成功组");
  assert.deepEqual(organizations[0].owners, ["owner@example.com"]);
  assert.equal(organizations[0].memberCount, 4);
});

test("后台反馈列表会展示提交人、组织和状态", () => {
  const reports = formatAdminFeedbackReports([
    {
      id: "feedback-1",
      message: "按钮没有反应",
      status: "open",
      created_at: "2026-06-13T00:00:00.000Z",
      reporter_email: "user@example.com",
      organization_name: "客户成功组"
    }
  ]);

  assert.equal(reports[0].message, "按钮没有反应");
  assert.equal(reports[0].status, "open");
  assert.equal(reports[0].reporterEmail, "user@example.com");
  assert.equal(reports[0].organizationName, "客户成功组");
});

test("只有平台管理员状态会读取后台数据", () => {
  assert.equal(shouldLoadAdminData(null), false);
  assert.equal(shouldLoadAdminData({ role: "user" }), false);
  assert.equal(shouldLoadAdminData({ role: "admin" }), true);
});

test("后台用户搜索会按邮箱和角色过滤", () => {
  const users = [
    { email: "admin@example.com", role: "admin", organizationCount: 2 },
    { email: "member@example.com", role: "user", organizationCount: 1 }
  ];

  assert.deepEqual(filterAdminUsers(users, "admin").map((user) => user.email), ["admin@example.com"]);
  assert.deepEqual(filterAdminUsers(users, "member").map((user) => user.email), ["member@example.com"]);
});

test("后台组织搜索会按组织名和 owner 邮箱过滤", () => {
  const organizations = [
    { name: "客户成功组", owners: ["owner@example.com"], memberCount: 4 },
    { name: "产品组", owners: ["pm@example.com"], memberCount: 2 }
  ];

  assert.deepEqual(filterAdminOrganizations(organizations, "客户").map((organization) => organization.name), ["客户成功组"]);
  assert.deepEqual(filterAdminOrganizations(organizations, "pm@example.com").map((organization) => organization.name), ["产品组"]);
});

test("后台反馈搜索和状态筛选可以一起工作", () => {
  const reports = [
    { message: "按钮没有反应", status: "open", reporterEmail: "user@example.com", organizationName: "客户成功组" },
    { message: "已经修复", status: "resolved", reporterEmail: "admin@example.com", organizationName: "产品组" }
  ];

  const byText = filterAdminFeedbackReports(reports, { query: "按钮", status: "all" });
  const byStatus = filterAdminFeedbackReports(reports, { query: "", status: "resolved" });

  assert.deepEqual(byText.map((report) => report.message), ["按钮没有反应"]);
  assert.deepEqual(byStatus.map((report) => report.status), ["resolved"]);
});

test("后台组织详情会整理成员、反馈和词库备份摘要", () => {
  const detail = formatAdminOrganizationDetail({
    id: "org-1",
    name: "客户成功组",
    created_at: "2026-06-13T00:00:00.000Z",
    members: [
      { user_id: "owner-1", email: "owner@example.com", role: "owner", created_at: "2026-06-13T00:00:00.000Z" },
      { user_id: "member-1", email: "member@example.com", role: "member", created_at: "2026-06-13T01:00:00.000Z" }
    ],
    feedback_reports: [
      { id: "feedback-1", message: "组织词库打不开", status: "open", reporter_email: "member@example.com", created_at: "2026-06-13T02:00:00.000Z" }
    ],
    term_backup: {
      updated_at: "2026-06-13T03:00:00.000Z",
      term_count: 12
    }
  });

  assert.equal(detail.name, "客户成功组");
  assert.deepEqual(detail.owners.map((member) => member.email), ["owner@example.com"]);
  assert.deepEqual(detail.members.map((member) => member.email), ["owner@example.com", "member@example.com"]);
  assert.equal(detail.feedbackReports[0].message, "组织词库打不开");
  assert.equal(detail.termBackup.termCount, 12);
});
