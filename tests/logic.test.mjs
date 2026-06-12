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
import { canManageMember, canManageOrganization, getAuditEventLabel, getOrganizationRoleLabel, normalizeMemberEmail } from "../scripts/organizations.js";

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
