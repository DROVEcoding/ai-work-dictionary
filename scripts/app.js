import { categoryLabels, createTerm, defaultTerms, statusLabels } from "./data.js";
import { filterTerms } from "./filters.js";
import {
  downloadTermsFromCloud,
  downloadOrganizationTermsFromCloud,
  getCloudUser,
  signInCloudUser,
  signOutCloudUser,
  signUpCloudUser,
  uploadTermsToCloud,
  uploadOrganizationTermsToCloud
} from "./cloudSync.js";
import { createSupabaseClient, isSupabaseConfigured } from "./supabaseClient.js";
import { exportTermsBackup, importTermsBackup, loadTerms, loadTermsOrResetIfEmpty, resetTerms, saveTerms } from "./storage.js";
import { CURRENT_VERSION, compareVersions, fetchLatestVersion } from "./version.js";
import { canManagePublicTerms, getRoleLabel, loadProfile, loadPublicTerms, publishPublicTerms } from "./permissions.js";
import { createOrganization, getOrganizationRoleLabel, loadMyOrganizations } from "./organizations.js";
import { renderTerms } from "./render.js";
import { updateTermContent } from "./termActions.js";

const supabase = await createSupabaseClient();
const entryView = document.querySelector("#entryView");
const appView = document.querySelector("#appView");
const guestModeButton = document.querySelector("#guestModeButton");
const identityLabel = document.querySelector("#identityLabel");
const exitIdentityButton = document.querySelector("#exitIdentityButton");
const grid = document.querySelector("#dictionaryGrid");
const searchInput = document.querySelector("#searchInput");
const categoryButtons = document.querySelectorAll("[data-category]");
const statusButtons = document.querySelectorAll("[data-status]");
const emptyState = document.querySelector("#emptyState");
const termCount = document.querySelector("#termCount");
const workspaceLabel = document.querySelector("#workspaceLabel");
const termForm = document.querySelector("#termForm");
const termInput = document.querySelector("#termInput");
const categoryInput = document.querySelector("#categoryInput");
const definitionInput = document.querySelector("#definitionInput");
const solvesInput = document.querySelector("#solvesInput");
const formMessage = document.querySelector("#formMessage");
const resetButton = document.querySelector("#resetButton");
const formTitle = document.querySelector("#formTitle");
const editHint = document.querySelector("#editHint");
const submitButton = document.querySelector("#submitButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const exportButton = document.querySelector("#exportButton");
const importInput = document.querySelector("#importInput");
const backupMessage = document.querySelector("#backupMessage");
const cloudAuthForm = document.querySelector("#cloudAuthForm");
const cloudEmailInput = document.querySelector("#cloudEmailInput");
const cloudPasswordInput = document.querySelector("#cloudPasswordInput");
const cloudSignUpButton = document.querySelector("#cloudSignUpButton");
const cloudSession = document.querySelector("#cloudSession");
const cloudUserDisplay = document.querySelector("#cloudUserDisplay");
const uploadCloudButton = document.querySelector("#uploadCloudButton");
const downloadCloudButton = document.querySelector("#downloadCloudButton");
const cloudSignOutButton = document.querySelector("#cloudSignOutButton");
const cloudMessage = document.querySelector("#cloudMessage");
const organizationForm = document.querySelector("#organizationForm");
const organizationNameInput = document.querySelector("#organizationNameInput");
const createOrganizationButton = document.querySelector("#createOrganizationButton");
const organizationSelect = document.querySelector("#organizationSelect");
const organizationRoleLabel = document.querySelector("#organizationRoleLabel");
const organizationMessage = document.querySelector("#organizationMessage");
const roleLabel = document.querySelector("#roleLabel");
const loadPublicTermsButton = document.querySelector("#loadPublicTermsButton");
const publishPublicTermsButton = document.querySelector("#publishPublicTermsButton");
const permissionsMessage = document.querySelector("#permissionsMessage");
const currentVersionLabel = document.querySelector("#currentVersionLabel");
const latestVersionLabel = document.querySelector("#latestVersionLabel");
const checkUpdateButton = document.querySelector("#checkUpdateButton");
const versionChanges = document.querySelector("#versionChanges");
const versionMessage = document.querySelector("#versionMessage");

const state = {
  cloudUser: null,
  profile: null,
  organizations: [],
  currentOrganizationId: null,
  isGuestMode: false,
  terms: [],
  category: "all",
  status: "all",
  query: "",
  editingTermId: null
};

state.terms = loadTerms(window.localStorage, defaultTerms, getActiveTermsUserId());

function setActiveButton(buttons, activeValue, dataName) {
  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset[dataName] === activeValue);
  });
}

function renderApp() {
  renderIdentity();
  renderCloudAuth();
  renderOrganizations();
  renderPermissions();

  const visibleTerms = filterTerms(state.terms, {
    query: state.query,
    category: state.category,
    status: state.status
  });

  renderTerms(grid, visibleTerms, {
    statusLabels,
    onStatusChange: updateTermStatus,
    onEdit: enterEditMode,
    onDelete: deleteTerm
  });

  emptyState.hidden = visibleTerms.length > 0;
  termCount.textContent = state.terms.length;
  workspaceLabel.textContent = getActiveWorkspaceLabel();
}

function persistAndRender() {
  saveTerms(window.localStorage, state.terms, getActiveTermsUserId());
  renderApp();
}

function getActiveTermsUserId() {
  if (state.currentOrganizationId) {
    return `organization:${state.currentOrganizationId}`;
  }

  return state.cloudUser ? `cloud:${state.cloudUser.id}` : null;
}

function getActiveWorkspaceLabel() {
  const currentOrganization = getCurrentOrganization();
  if (currentOrganization) {
    return `组织空间：${currentOrganization.name}`;
  }

  if (state.cloudUser) {
    return `个人云端空间：${state.cloudUser.email}`;
  }

  return "访客本地空间";
}

function loadCurrentWorkspaceTerms() {
  return loadTerms(window.localStorage, defaultTerms, getActiveTermsUserId());
}

function loadLocalFallbackTermsAfterCloudSignOut() {
  return loadTermsOrResetIfEmpty(window.localStorage, defaultTerms, getActiveTermsUserId());
}

function showCloudMessage(message, type = "error") {
  cloudMessage.textContent = message;
  cloudMessage.dataset.type = type;
  cloudMessage.hidden = !message;
}

function showVersionMessage(message, type = "error") {
  versionMessage.textContent = message;
  versionMessage.dataset.type = type;
  versionMessage.hidden = !message;
}

function showPermissionsMessage(message, type = "error") {
  permissionsMessage.textContent = message;
  permissionsMessage.dataset.type = type;
  permissionsMessage.hidden = !message;
}

function showOrganizationMessage(message, type = "error") {
  organizationMessage.textContent = message;
  organizationMessage.dataset.type = type;
  organizationMessage.hidden = !message;
}

function getCurrentOrganization() {
  return state.organizations.find((organization) => organization.id === state.currentOrganizationId) || null;
}

function renderOrganizations() {
  const isLoggedIn = Boolean(state.cloudUser);
  const currentOrganization = getCurrentOrganization();

  organizationForm.querySelectorAll("input, button").forEach((element) => {
    element.disabled = !isLoggedIn;
  });
  createOrganizationButton.disabled = !isLoggedIn;
  organizationSelect.disabled = !isLoggedIn || state.organizations.length === 0;

  organizationSelect.innerHTML = "";
  if (!isLoggedIn) {
    const option = new Option("请先登录云端账号", "");
    organizationSelect.append(option);
    organizationRoleLabel.textContent = "当前组织角色：未登录";
    return;
  }

  if (state.organizations.length === 0) {
    const option = new Option("还没有组织，请先创建", "");
    organizationSelect.append(option);
    organizationRoleLabel.textContent = "当前组织角色：未选择";
    return;
  }

  state.organizations.forEach((organization) => {
    const option = new Option(organization.name, organization.id);
    organizationSelect.append(option);
  });
  organizationSelect.value = currentOrganization?.id || state.organizations[0].id;
  organizationRoleLabel.textContent = `当前组织角色：${getOrganizationRoleLabel(currentOrganization?.role || state.organizations[0].role)}`;
}

async function refreshOrganizations() {
  if (!state.cloudUser) {
    state.organizations = [];
    state.currentOrganizationId = null;
    return;
  }

  const result = await loadMyOrganizations(supabase);
  if (!result.ok) {
    state.organizations = [];
    state.currentOrganizationId = null;
    showOrganizationMessage(result.message);
    return;
  }

  state.organizations = result.organizations;
  if (!state.organizations.some((organization) => organization.id === state.currentOrganizationId)) {
    state.currentOrganizationId = state.organizations[0]?.id || null;
  }
  showOrganizationMessage(result.message, "success");
}

function renderVersionChanges(changes = []) {
  versionChanges.innerHTML = "";
  changes.forEach((change) => {
    const item = document.createElement("li");
    item.textContent = change;
    versionChanges.append(item);
  });
}

function renderCurrentVersion() {
  currentVersionLabel.textContent = `当前版本：v${CURRENT_VERSION}`;
}

function setCloudButtonsDisabled(isDisabled) {
  cloudSignUpButton.disabled = isDisabled;
  uploadCloudButton.disabled = isDisabled;
  downloadCloudButton.disabled = isDisabled;
  cloudSignOutButton.disabled = isDisabled;
  cloudAuthForm.querySelectorAll("button").forEach((button) => {
    button.disabled = isDisabled;
  });
}

function renderPermissions() {
  const isLoggedIn = Boolean(state.cloudUser);
  const canManage = canManagePublicTerms(state.profile);

  roleLabel.textContent = isLoggedIn
    ? `当前角色：${getRoleLabel(state.profile?.role)}`
    : "当前角色：未登录";

  loadPublicTermsButton.disabled = !isLoggedIn;
  publishPublicTermsButton.hidden = !canManage;
}

function renderIdentity() {
  const hasIdentity = state.isGuestMode || Boolean(state.cloudUser);
  entryView.hidden = hasIdentity;
  appView.hidden = !hasIdentity;
  identityLabel.textContent = state.cloudUser
    ? `云端账号：${state.cloudUser.email}`
    : "访客模式";
}

function renderCloudAuth() {
  const isConfigured = isSupabaseConfigured();
  const isLoggedIn = Boolean(state.cloudUser);

  cloudUserDisplay.textContent = isLoggedIn
    ? `云端账号：${state.cloudUser.email}`
    : "当前为访客模式，云端同步需要登录。";
  uploadCloudButton.disabled = !isLoggedIn;
  downloadCloudButton.disabled = !isLoggedIn;
  cloudSignOutButton.hidden = !isLoggedIn;

  if (!isConfigured) {
    showCloudMessage("Supabase 还没有配置。请先按 V7 文档创建项目、建表，并填写 scripts/supabaseConfig.js。");
  }
}

async function refreshCloudUser() {
  const result = await getCloudUser(supabase);
  state.cloudUser = result.ok ? result.user : null;
  if (result.ok) {
    const profileResult = await loadProfile(supabase, result.user);
    state.profile = profileResult.profile;
    state.isGuestMode = false;
    await refreshOrganizations();
    state.terms = loadCurrentWorkspaceTerms();
    exitEditMode();
    showCloudMessage(`${result.message} ${profileResult.message}`, "success");
  } else {
    state.profile = null;
    state.organizations = [];
    state.currentOrganizationId = null;
  }
  renderApp();
}

function updateTermStatus(id, status) {
  state.terms = state.terms.map((term) => (
    term.id === id ? { ...term, status } : term
  ));
  persistAndRender();
}

function deleteTerm(id) {
  state.terms = state.terms.filter((term) => term.id !== id);
  if (state.editingTermId === id) {
    exitEditMode();
  }
  persistAndRender();
}

function showFormMessage(message, type = "error") {
  formMessage.textContent = message;
  formMessage.dataset.type = type;
  formMessage.hidden = !message;
}

function showBackupMessage(message, type = "error") {
  backupMessage.textContent = message;
  backupMessage.dataset.type = type;
  backupMessage.hidden = !message;
}

function validateForm() {
  if (!termInput.value.trim() || !definitionInput.value.trim() || !solvesInput.value.trim()) {
    showFormMessage("请把词条名称、解释、解决的问题都填写完整。");
    return false;
  }

  if (!categoryLabels[categoryInput.value]) {
    showFormMessage("请选择一个有效分类。");
    return false;
  }

  return true;
}

function setFormMode(mode) {
  const isEditing = mode === "edit";
  formTitle.textContent = isEditing ? "编辑词条" : "新增学习词条";
  submitButton.textContent = isEditing ? "保存修改" : "新增词条";
  cancelEditButton.hidden = !isEditing;
  editHint.hidden = !isEditing;
}

function fillForm(term) {
  termInput.value = term.term;
  categoryInput.value = term.category;
  definitionInput.value = term.definition;
  solvesInput.value = term.solves;
}

function clearForm() {
  termForm.reset();
  showFormMessage("");
}

function enterEditMode(id) {
  const term = state.terms.find((item) => item.id === id);
  if (!term) {
    showFormMessage("没有找到要编辑的词条。");
    return;
  }

  state.editingTermId = id;
  fillForm(term);
  setFormMode("edit");
  showFormMessage(`正在编辑：${term.term}`, "success");
  termInput.focus();
}

function exitEditMode() {
  state.editingTermId = null;
  clearForm();
  setFormMode("add");
}

termForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const formValues = {
    term: termInput.value,
    category: categoryInput.value,
    definition: definitionInput.value,
    solves: solvesInput.value
  };

  if (state.editingTermId) {
    state.terms = updateTermContent(state.terms, state.editingTermId, formValues);
    state.editingTermId = null;
    termForm.reset();
    setFormMode("add");
    showFormMessage("已保存修改。", "success");
    persistAndRender();
    return;
  }

  state.terms = [
    createTerm({
      term: termInput.value,
      category: categoryInput.value,
      definition: definitionInput.value,
      solves: solvesInput.value
    }),
    ...state.terms
  ];

  termForm.reset();
  showFormMessage("已新增词条。", "success");
  persistAndRender();
});

cancelEditButton.addEventListener("click", () => {
  exitEditMode();
});

searchInput.addEventListener("input", () => {
  state.query = searchInput.value;
  renderApp();
});

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.category = button.dataset.category;
    setActiveButton(categoryButtons, state.category, "category");
    renderApp();
  });
});

statusButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.status = button.dataset.status;
    setActiveButton(statusButtons, state.status, "status");
    renderApp();
  });
});

resetButton.addEventListener("click", () => {
  const confirmed = window.confirm("确定要重置回默认词库吗？自定义词条和学习状态都会清空。");
  if (!confirmed) {
    return;
  }

  state.terms = resetTerms(window.localStorage, defaultTerms, getActiveTermsUserId());
  showFormMessage("已重置为默认词库。", "success");
  renderApp();
});

exportButton.addEventListener("click", () => {
  const backupText = exportTermsBackup(state.terms);
  const blob = new Blob([backupText], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `ai-work-dictionary-backup-${date}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showBackupMessage("已导出备份文件。", "success");
});

importInput.addEventListener("change", async () => {
  const file = importInput.files?.[0];
  if (!file) {
    return;
  }

  const backupText = await file.text();
  const result = importTermsBackup(backupText);
  if (!result.ok) {
    showBackupMessage(result.message);
    importInput.value = "";
    return;
  }

  state.terms = result.terms;
  saveTerms(window.localStorage, state.terms, getActiveTermsUserId());
  exitEditMode();
  renderApp();
  showBackupMessage(`导入成功，共恢复 ${state.terms.length} 个词条。`, "success");
  importInput.value = "";
});

guestModeButton.addEventListener("click", () => {
  state.isGuestMode = true;
  state.cloudUser = null;
  state.profile = null;
  state.organizations = [];
  state.currentOrganizationId = null;
  state.terms = loadLocalFallbackTermsAfterCloudSignOut();
  showCloudMessage("");
  showOrganizationMessage("");
  renderApp();
});

exitIdentityButton.addEventListener("click", async () => {
  if (state.cloudUser) {
    await signOutCloudUser(supabase);
  }

  state.cloudUser = null;
  state.profile = null;
  state.organizations = [];
  state.currentOrganizationId = null;
  state.isGuestMode = false;
  state.terms = loadLocalFallbackTermsAfterCloudSignOut();
  exitEditMode();
  showCloudMessage("");
  showOrganizationMessage("");
  renderApp();
});

organizationForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!state.cloudUser) {
    showOrganizationMessage("请先登录云端账号。");
    return;
  }

  createOrganizationButton.disabled = true;
  showOrganizationMessage("正在创建组织...", "success");
  try {
    const result = await createOrganization(supabase, organizationNameInput.value, state.cloudUser.id);
    if (!result.ok) {
      showOrganizationMessage(result.message);
      return;
    }

    organizationNameInput.value = "";
    await refreshOrganizations();
    state.currentOrganizationId = result.organization.id;
    state.terms = loadCurrentWorkspaceTerms();
    exitEditMode();
    renderApp();
    showOrganizationMessage(result.message, "success");
  } finally {
    createOrganizationButton.disabled = false;
  }
});

organizationSelect.addEventListener("change", () => {
  state.currentOrganizationId = organizationSelect.value || null;
  state.terms = loadCurrentWorkspaceTerms();
  exitEditMode();
  showOrganizationMessage("已切换组织，本地显示当前组织的词库缓存；需要最新云端数据时请点击“从云端恢复”。", "success");
  renderApp();
});

cloudAuthForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  setCloudButtonsDisabled(true);
  showCloudMessage("正在登录云端账号，请稍等...", "success");
  try {
    const result = await signInCloudUser(supabase, cloudEmailInput.value, cloudPasswordInput.value);
    showCloudMessage(result.message, result.ok ? "success" : "error");
    if (result.ok) {
      state.isGuestMode = false;
      cloudPasswordInput.value = "";
      await refreshCloudUser();
    }
  } finally {
    setCloudButtonsDisabled(false);
  }
});

cloudSignUpButton.addEventListener("click", async () => {
  setCloudButtonsDisabled(true);
  showCloudMessage("正在注册云端账号，请稍等...", "success");
  try {
    const result = await signUpCloudUser(supabase, cloudEmailInput.value, cloudPasswordInput.value);
    showCloudMessage(result.message, result.ok ? "success" : "error");
  } finally {
    setCloudButtonsDisabled(false);
  }
});

uploadCloudButton.addEventListener("click", async () => {
  setCloudButtonsDisabled(true);
  showCloudMessage("正在上传到云端，请稍等...", "success");
  try {
  const userResult = await getCloudUser(supabase);
  if (!userResult.ok) {
    showCloudMessage(userResult.message);
    return;
  }

  const result = state.currentOrganizationId
    ? await uploadOrganizationTermsToCloud(supabase, state.currentOrganizationId, userResult.user.id, state.terms)
    : await uploadTermsToCloud(supabase, userResult.user.id, state.terms);
  showCloudMessage(result.message, result.ok ? "success" : "error");
  } finally {
    setCloudButtonsDisabled(false);
  }
});

downloadCloudButton.addEventListener("click", async () => {
  setCloudButtonsDisabled(true);
  showCloudMessage("正在从云端恢复，请稍等...", "success");
  try {
  const userResult = await getCloudUser(supabase);
  if (!userResult.ok) {
    showCloudMessage(userResult.message);
    return;
  }

  const result = state.currentOrganizationId
    ? await downloadOrganizationTermsFromCloud(supabase, state.currentOrganizationId)
    : await downloadTermsFromCloud(supabase, userResult.user.id);
  if (!result.ok) {
    showCloudMessage(result.message);
    return;
  }

  state.terms = result.terms;
  saveTerms(window.localStorage, state.terms, getActiveTermsUserId());
  exitEditMode();
  renderApp();
  showCloudMessage(result.message, "success");
  } finally {
    setCloudButtonsDisabled(false);
  }
});

cloudSignOutButton.addEventListener("click", async () => {
  setCloudButtonsDisabled(true);
  showCloudMessage("正在退出云端账号，请稍等...", "success");
  try {
    const result = await signOutCloudUser(supabase);
    state.cloudUser = null;
    state.profile = null;
    state.organizations = [];
    state.currentOrganizationId = null;
    state.terms = loadLocalFallbackTermsAfterCloudSignOut();
    exitEditMode();
    showCloudMessage(result.message, result.ok ? "success" : "error");
    showOrganizationMessage("");
    renderApp();
  } finally {
    setCloudButtonsDisabled(false);
  }
});

loadPublicTermsButton.addEventListener("click", async () => {
  if (!state.cloudUser) {
    showPermissionsMessage("请先登录云端账号。");
    return;
  }

  loadPublicTermsButton.disabled = true;
  showPermissionsMessage("正在读取公共词库...", "success");
  try {
    const result = await loadPublicTerms(supabase);
    if (!result.ok) {
      showPermissionsMessage(result.message);
      return;
    }

    state.terms = result.terms;
    saveTerms(window.localStorage, state.terms, getActiveTermsUserId());
    exitEditMode();
    renderApp();
    showPermissionsMessage(result.message, "success");
  } finally {
    loadPublicTermsButton.disabled = false;
  }
});

publishPublicTermsButton.addEventListener("click", async () => {
  if (!canManagePublicTerms(state.profile)) {
    showPermissionsMessage("只有管理员可以发布公共词库。");
    return;
  }

  publishPublicTermsButton.disabled = true;
  showPermissionsMessage("正在发布公共词库...", "success");
  try {
    const result = await publishPublicTerms(supabase, state.terms);
    showPermissionsMessage(result.message, result.ok ? "success" : "error");
  } finally {
    publishPublicTermsButton.disabled = false;
  }
});

checkUpdateButton.addEventListener("click", async () => {
  checkUpdateButton.disabled = true;
  showVersionMessage("正在检查最新版本...", "success");
  try {
    const latest = await fetchLatestVersion();
    const status = compareVersions(CURRENT_VERSION, latest.version);
    latestVersionLabel.textContent = `最新版本：v${latest.version}（${latest.codename}）`;
    renderVersionChanges(latest.changes);

    if (status === "outdated") {
      showVersionMessage("发现新版本。Web 版请刷新页面；桌面版请到 GitHub Release 下载新版。", "success");
      return;
    }

    if (status === "ahead") {
      showVersionMessage("当前本地版本比线上版本更新，通常说明你正在测试开发版。", "success");
      return;
    }

    showVersionMessage("当前已经是最新版本。", "success");
  } catch (error) {
    showVersionMessage(error.message);
  } finally {
    checkUpdateButton.disabled = false;
  }
});

// Service Worker 让网页具备离线缓存能力。失败时不影响正常在线使用。
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(() => {
    showBackupMessage("离线缓存暂时不可用，但在线功能不受影响。");
  });
}

renderApp();
renderCurrentVersion();
refreshCloudUser();
