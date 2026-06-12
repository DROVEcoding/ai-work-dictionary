export function createDefaultProfile(user) {
  return {
    id: user.id,
    email: user.email,
    role: "user"
  };
}

export function getRoleLabel(role) {
  return role === "admin" ? "管理员" : "普通用户";
}

export function canManagePublicTerms(profile) {
  return profile?.role === "admin";
}

export async function loadProfile(supabase, user) {
  if (!supabase || !user) {
    return { ok: false, profile: null, message: "请先登录云端账号。" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return { ok: false, profile: null, message: error.message };
  }

  return {
    ok: true,
    profile: data || createDefaultProfile(user),
    message: "已读取当前账号权限。"
  };
}

export async function loadPublicTerms(supabase) {
  const { data, error } = await supabase
    .from("public_terms")
    .select("terms, updated_at")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    return { ok: false, terms: null, message: error.message };
  }

  if (!data) {
    return { ok: false, terms: null, message: "公共词库还没有发布内容。" };
  }

  return {
    ok: true,
    terms: data.terms,
    message: `已读取公共词库，更新时间：${new Date(data.updated_at).toLocaleString()}。`
  };
}

export async function publishPublicTerms(supabase, terms) {
  const { error } = await supabase
    .from("public_terms")
    .upsert({
      id: "default",
      terms,
      updated_at: new Date().toISOString()
    }, { onConflict: "id" });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "已发布为公共词库。" };
}
