export function getOrganizationRoleLabel(role) {
  return role === "owner" ? "拥有者" : "成员";
}

export function canManageOrganization(role) {
  return role === "owner";
}

export function canManageMember(currentRole, member, currentUserId) {
  return currentRole === "owner" && member.userId !== currentUserId && member.role === "member";
}

export function normalizeMemberEmail(email) {
  return email.trim().toLowerCase();
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
    .rpc("create_organization", { org_name: normalizedName })
    .single();

  if (error) {
    return { ok: false, organization: null, message: error.message };
  }

  return { ok: true, organization: data, message: "组织已创建。" };
}

export async function addOrganizationMember(supabase, organizationId, email) {
  const normalizedEmail = normalizeMemberEmail(email);
  if (!organizationId) {
    return { ok: false, member: null, message: "请先选择一个组织。" };
  }

  if (!normalizedEmail) {
    return { ok: false, member: null, message: "请输入成员邮箱。" };
  }

  const { data, error } = await supabase
    .rpc("add_organization_member", {
      org_id: organizationId,
      member_email: normalizedEmail
    })
    .single();

  if (error) {
    return { ok: false, member: null, message: error.message };
  }

  return { ok: true, member: data, message: "成员已加入当前组织。" };
}

export async function loadOrganizationMembers(supabase, organizationId) {
  if (!organizationId) {
    return { ok: true, members: [], message: "还没有选择组织。" };
  }

  const { data, error } = await supabase
    .rpc("list_organization_members", { org_id: organizationId });

  if (error) {
    return { ok: false, members: [], message: error.message };
  }

  return {
    ok: true,
    members: (data || []).map((member) => ({
      userId: member.user_id,
      email: member.email,
      role: member.role,
      createdAt: member.created_at
    })),
    message: "已读取当前组织成员。"
  };
}

export async function promoteOrganizationMember(supabase, organizationId, memberUserId) {
  if (!organizationId || !memberUserId) {
    return { ok: false, member: null, message: "请先选择要升级的成员。" };
  }

  const { data, error } = await supabase
    .rpc("promote_organization_member", {
      org_id: organizationId,
      member_user_id: memberUserId
    })
    .single();

  if (error) {
    return { ok: false, member: null, message: error.message };
  }

  return { ok: true, member: data, message: "成员已升级为拥有者。" };
}

export async function removeOrganizationMember(supabase, organizationId, memberUserId) {
  if (!organizationId || !memberUserId) {
    return { ok: false, message: "请先选择要移除的成员。" };
  }

  const { error } = await supabase
    .rpc("remove_organization_member", {
      org_id: organizationId,
      member_user_id: memberUserId
    });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "成员已移出当前组织。" };
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
