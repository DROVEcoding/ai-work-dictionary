export function getOrganizationRoleLabel(role) {
  return role === "owner" ? "拥有者" : "成员";
}

export function canManageOrganization(role) {
  return role === "owner";
}

export async function createOrganization(supabase, name, userId) {
  const normalizedName = name.trim();
  if (normalizedName.length < 2 || normalizedName.length > 40) {
    return { ok: false, organization: null, message: "组织名称需要 2 到 40 个字符。" };
  }

  if (!userId) {
    return { ok: false, organization: null, message: "请先登录云端账号。" };
  }

  const { data, error } = await supabase
    .from("organizations")
    .insert({ name: normalizedName })
    .select("id, name, created_at")
    .single();

  if (error) {
    return { ok: false, organization: null, message: error.message };
  }

  return { ok: true, organization: data, message: "组织已创建。" };
}

export async function loadMyOrganizations(supabase) {
  const { data, error } = await supabase
    .from("organization_memberships")
    .select("role, organization:organizations(id, name, created_at)")
    .order("created_at", { ascending: true });

  if (error) {
    return { ok: false, organizations: [], message: error.message };
  }

  return {
    ok: true,
    organizations: (data || [])
      .filter((item) => item.organization)
      .map((item) => ({
        id: item.organization.id,
        name: item.organization.name,
        createdAt: item.organization.created_at,
        role: item.role
      })),
    message: "已读取我的组织。"
  };
}
