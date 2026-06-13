import { getCloudUser } from "./cloudSync.js";
import { loadProfile, getRoleLabel } from "./permissions.js";
import { createSupabaseClient, isSupabaseConfigured } from "./supabaseClient.js";
import {
  filterAdminFeedbackReports,
  filterAdminOrganizations,
  filterAdminUsers,
  loadAdminFeedbackReports,
  loadAdminOrganizationDetail,
  loadAdminOrganizations,
  loadAdminOverview,
  loadAdminUsers,
  shouldLoadAdminData
} from "./adminData.js";

const supabase = await createSupabaseClient();

const adminIdentityLabel = document.querySelector("#adminIdentityLabel");
const adminRefreshButton = document.querySelector("#adminRefreshButton");
const adminGate = document.querySelector("#adminGate");
const adminContent = document.querySelector("#adminContent");
const adminOverview = document.querySelector("#adminOverview");
const adminSearchInput = document.querySelector("#adminSearchInput");
const adminFeedbackStatusFilter = document.querySelector("#adminFeedbackStatusFilter");
const adminUsers = document.querySelector("#adminUsers");
const adminOrganizations = document.querySelector("#adminOrganizations");
const adminOrganizationDetailPanel = document.querySelector("#adminOrganizationDetailPanel");
const adminOrganizationDetailTitle = document.querySelector("#adminOrganizationDetailTitle");
const adminOrganizationDetail = document.querySelector("#adminOrganizationDetail");
const adminFeedback = document.querySelector("#adminFeedback");

const state = {
  overview: null,
  users: [],
  organizations: [],
  feedbackReports: [],
  searchQuery: "",
  feedbackStatus: "all",
  selectedOrganizationId: null,
  selectedOrganizationDetail: null
};

function setGateMessage(message, type = "info") {
  adminGate.textContent = message;
  adminGate.dataset.type = type;
  adminGate.hidden = !message;
}

function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function createBadge(text) {
  const badge = document.createElement("span");
  badge.className = "admin-badge";
  badge.textContent = text;
  return badge;
}

function createEmptyRow(message, columnCount) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = columnCount;
  cell.className = "admin-empty-cell";
  cell.textContent = message;
  row.append(cell);
  return row;
}

function renderOverview() {
  if (!state.overview) {
    adminOverview.replaceChildren();
    return;
  }

  const cards = [
    ["用户", state.overview.userCount],
    ["组织", state.overview.organizationCount],
    ["反馈", state.overview.feedbackCount],
    ["未处理反馈", state.overview.openFeedbackCount]
  ];

  adminOverview.replaceChildren(...cards.map(([label, value]) => {
    const card = document.createElement("div");
    card.className = "admin-overview-card";

    const number = document.createElement("strong");
    number.textContent = value;

    const caption = document.createElement("span");
    caption.textContent = label;

    card.append(number, caption);
    return card;
  }));
}

function renderUsers() {
  const users = filterAdminUsers(state.users, state.searchQuery);
  if (users.length === 0) {
    adminUsers.replaceChildren(createEmptyRow("没有匹配的用户。", 4));
    return;
  }

  adminUsers.replaceChildren(...users.map((user) => {
    const row = document.createElement("tr");
    const roleCell = document.createElement("td");
    roleCell.append(createBadge(getRoleLabel(user.role)));
    row.append(
      createCell(user.email),
      roleCell,
      createCell(String(user.organizationCount)),
      createCell(new Date(user.createdAt).toLocaleString())
    );
    return row;
  }));
}

function renderOrganizations() {
  const organizations = filterAdminOrganizations(state.organizations, state.searchQuery);
  if (organizations.length === 0) {
    adminOrganizations.replaceChildren(createEmptyRow("没有匹配的组织。", 5));
    return;
  }

  adminOrganizations.replaceChildren(...organizations.map((organization) => {
    const row = document.createElement("tr");
    const owners = organization.owners.length > 0 ? organization.owners.join("、") : "暂无拥有者";
    const actionCell = document.createElement("td");
    const detailButton = document.createElement("button");
    detailButton.className = "secondary-button admin-table-button";
    detailButton.type = "button";
    detailButton.textContent = "查看详情";
    detailButton.dataset.organizationId = organization.id;
    actionCell.append(detailButton);

    row.append(
      createCell(organization.name),
      createCell(owners),
      createCell(String(organization.memberCount)),
      createCell(new Date(organization.createdAt).toLocaleString()),
      actionCell
    );
    return row;
  }));
}

function renderFeedback() {
  const reports = filterAdminFeedbackReports(state.feedbackReports, {
    query: state.searchQuery,
    status: state.feedbackStatus
  });
  if (reports.length === 0) {
    adminFeedback.replaceChildren(createEmptyRow("没有匹配的反馈。", 5));
    return;
  }

  adminFeedback.replaceChildren(...reports.map((report) => {
    const row = document.createElement("tr");
    const statusCell = document.createElement("td");
    statusCell.append(createBadge(report.status));
    row.append(
      createCell(report.message),
      createCell(report.reporterEmail),
      createCell(report.organizationName),
      statusCell,
      createCell(new Date(report.createdAt).toLocaleString())
    );
    return row;
  }));
}

function createDetailBlock(title, content) {
  const block = document.createElement("div");
  block.className = "admin-detail-block";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const body = document.createElement("div");
  body.className = "admin-detail-body";
  if (typeof content === "string") {
    body.textContent = content;
  } else {
    body.append(content);
  }
  block.append(heading, body);
  return block;
}

function createMiniList(items, emptyText, renderItem) {
  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "admin-empty-text";
    empty.textContent = emptyText;
    return empty;
  }

  const list = document.createElement("div");
  list.className = "admin-mini-list";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "admin-mini-row";
    row.textContent = renderItem(item);
    list.append(row);
  });
  return list;
}

function renderOrganizationDetail() {
  const detail = state.selectedOrganizationDetail;
  if (!detail) {
    adminOrganizationDetailPanel.hidden = true;
    adminOrganizationDetail.replaceChildren();
    return;
  }

  adminOrganizationDetailPanel.hidden = false;
  adminOrganizationDetailTitle.textContent = `组织详情：${detail.name}`;
  const backupText = detail.termBackup
    ? `已有备份，词条 ${detail.termBackup.termCount} 条，更新时间：${new Date(detail.termBackup.updatedAt).toLocaleString()}`
    : "还没有组织词库备份。";

  adminOrganizationDetail.replaceChildren(
    createDetailBlock("基本信息", `创建时间：${new Date(detail.createdAt).toLocaleString()}`),
    createDetailBlock("拥有者", createMiniList(detail.owners, "暂无拥有者。", (member) => member.email)),
    createDetailBlock("成员", createMiniList(detail.members, "暂无成员。", (member) => `${member.email} / ${member.role} / ${new Date(member.createdAt).toLocaleString()}`)),
    createDetailBlock("组织反馈", createMiniList(detail.feedbackReports, "暂无组织反馈。", (report) => `${report.message} / ${report.status} / ${report.reporterEmail}`)),
    createDetailBlock("词库备份", backupText)
  );
}

function renderAdminConsole() {
  renderOverview();
  renderUsers();
  renderOrganizations();
  renderFeedback();
  renderOrganizationDetail();
}

async function loadAdminConsole() {
  setGateMessage("正在读取后台数据...", "info");
  adminRefreshButton.disabled = true;
  const [overviewResult, usersResult, organizationsResult, feedbackResult] = await Promise.all([
    loadAdminOverview(supabase),
    loadAdminUsers(supabase),
    loadAdminOrganizations(supabase),
    loadAdminFeedbackReports(supabase)
  ]);

  const failedResult = [overviewResult, usersResult, organizationsResult, feedbackResult]
    .find((result) => !result.ok);
  if (failedResult) {
    setGateMessage(failedResult.message, "error");
    adminRefreshButton.disabled = false;
    return;
  }

  state.overview = overviewResult.overview;
  state.users = usersResult.users;
  state.organizations = organizationsResult.organizations;
  state.feedbackReports = feedbackResult.reports;
  adminContent.hidden = false;
  adminRefreshButton.hidden = false;
  adminRefreshButton.disabled = false;
  renderAdminConsole();
  setGateMessage("");
}

async function loadOrganizationDetail(organizationId) {
  state.selectedOrganizationId = organizationId;
  state.selectedOrganizationDetail = null;
  renderOrganizationDetail();
  setGateMessage("正在读取组织详情...", "info");
  const result = await loadAdminOrganizationDetail(supabase, organizationId);
  if (!result.ok) {
    setGateMessage(result.message, "error");
    return;
  }

  state.selectedOrganizationDetail = result.detail;
  renderOrganizationDetail();
  setGateMessage("");
}

async function initializeAdminPage() {
  if (!isSupabaseConfigured()) {
    adminIdentityLabel.textContent = "Supabase 未配置";
    setGateMessage("Supabase 未配置，无法读取后台数据。", "error");
    return;
  }

  const userResult = await getCloudUser(supabase);
  if (!userResult.ok) {
    adminIdentityLabel.textContent = "未登录";
    setGateMessage("请先返回词典页登录云端账号。", "error");
    return;
  }

  const profileResult = await loadProfile(supabase, userResult.user);
  if (!profileResult.ok || !profileResult.profile) {
    adminIdentityLabel.textContent = userResult.user.email;
    setGateMessage(profileResult.message, "error");
    return;
  }

  adminIdentityLabel.textContent = `${userResult.user.email} / ${getRoleLabel(profileResult.profile.role)}`;
  if (!shouldLoadAdminData(profileResult.profile)) {
    setGateMessage("当前账号不是超级管理员，不能访问后台。", "error");
    return;
  }

  await loadAdminConsole();
}

adminSearchInput.addEventListener("input", () => {
  state.searchQuery = adminSearchInput.value;
  renderAdminConsole();
});

adminFeedbackStatusFilter.addEventListener("change", () => {
  state.feedbackStatus = adminFeedbackStatusFilter.value;
  renderFeedback();
});

adminRefreshButton.addEventListener("click", async () => {
  await loadAdminConsole();
});

adminOrganizations.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-organization-id]");
  if (!button) {
    return;
  }

  await loadOrganizationDetail(button.dataset.organizationId);
});

initializeAdminPage();
