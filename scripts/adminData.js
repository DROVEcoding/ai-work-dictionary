export function shouldLoadAdminData(profile) {
  return profile?.role === "admin";
}

export function formatAdminOverview(row = {}) {
  return {
    userCount: Number(row.user_count || 0),
    organizationCount: Number(row.organization_count || 0),
    feedbackCount: Number(row.feedback_count || 0),
    openFeedbackCount: Number(row.open_feedback_count || 0)
  };
}

export function formatAdminUsers(rows = []) {
  return rows.map((user) => ({
    id: user.id,
    email: user.email || "未知用户",
    role: user.role || "user",
    createdAt: user.created_at,
    organizationCount: Number(user.organization_count || 0)
  }));
}

export function formatAdminOrganizations(rows = []) {
  return rows.map((organization) => ({
    id: organization.id,
    name: organization.name || "未命名组织",
    createdAt: organization.created_at,
    owners: organization.owners || [],
    memberCount: Number(organization.member_count || 0)
  }));
}

export function formatAdminFeedbackReports(rows = []) {
  return rows.map((report) => ({
    id: report.id,
    message: report.message,
    status: report.status || "open",
    createdAt: report.created_at,
    reporterEmail: report.reporter_email || "未知用户",
    organizationName: report.organization_name || "个人空间"
  }));
}

function matchesQuery(values, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) => String(value || "").toLowerCase().includes(normalizedQuery));
}

export function filterAdminUsers(users, query) {
  return users.filter((user) => matchesQuery([
    user.email,
    user.role,
    user.organizationCount
  ], query));
}

export function filterAdminOrganizations(organizations, query) {
  return organizations.filter((organization) => matchesQuery([
    organization.name,
    ...(organization.owners || []),
    organization.memberCount
  ], query));
}

export function filterAdminFeedbackReports(reports, { query = "", status = "all" } = {}) {
  return reports.filter((report) => {
    const matchesStatus = status === "all" || report.status === status;
    return matchesStatus && matchesQuery([
      report.message,
      report.status,
      report.reporterEmail,
      report.organizationName
    ], query);
  });
}

export function formatAdminOrganizationDetail(row = {}) {
  const members = (row.members || []).map((member) => ({
    userId: member.user_id,
    email: member.email || "未知用户",
    role: member.role || "member",
    createdAt: member.created_at
  }));
  const feedbackReports = (row.feedback_reports || []).map((report) => ({
    id: report.id,
    message: report.message,
    status: report.status || "open",
    reporterEmail: report.reporter_email || "未知用户",
    createdAt: report.created_at
  }));
  const termBackup = row.term_backup
    ? {
        updatedAt: row.term_backup.updated_at,
        termCount: Number(row.term_backup.term_count || 0)
      }
    : null;

  return {
    id: row.id,
    name: row.name || "未命名组织",
    createdAt: row.created_at,
    members,
    owners: members.filter((member) => member.role === "owner"),
    feedbackReports,
    termBackup
  };
}

export async function loadAdminOverview(supabase) {
  const { data, error } = await supabase.rpc("get_admin_overview").single();
  if (error) {
    return { ok: false, overview: null, message: error.message };
  }

  return { ok: true, overview: formatAdminOverview(data), message: "已读取后台总览。" };
}

export async function loadAdminUsers(supabase) {
  const { data, error } = await supabase.rpc("list_admin_users");
  if (error) {
    return { ok: false, users: [], message: error.message };
  }

  return { ok: true, users: formatAdminUsers(data || []), message: "已读取用户列表。" };
}

export async function loadAdminOrganizations(supabase) {
  const { data, error } = await supabase.rpc("list_admin_organizations");
  if (error) {
    return { ok: false, organizations: [], message: error.message };
  }

  return { ok: true, organizations: formatAdminOrganizations(data || []), message: "已读取组织列表。" };
}

export async function loadAdminFeedbackReports(supabase) {
  const { data, error } = await supabase.rpc("list_admin_feedback_reports");
  if (error) {
    return { ok: false, reports: [], message: error.message };
  }

  return { ok: true, reports: formatAdminFeedbackReports(data || []), message: "已读取反馈列表。" };
}

export async function loadAdminOrganizationDetail(supabase, organizationId) {
  const { data, error } = await supabase
    .rpc("get_admin_organization_detail", { org_id: organizationId })
    .single();

  if (error) {
    return { ok: false, detail: null, message: error.message };
  }

  return { ok: true, detail: formatAdminOrganizationDetail(data), message: "已读取组织详情。" };
}
