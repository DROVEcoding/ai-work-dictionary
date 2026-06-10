const CLOUD_TABLE = "term_backups";

export function createCloudBackupPayload(userId, terms) {
  return {
    owner_id: userId,
    terms,
    updated_at: new Date().toISOString()
  };
}

export async function getCloudUser(supabase) {
  if (!supabase) {
    return { ok: false, user: null, message: "Supabase 还没有配置。" };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return { ok: false, user: null, message: error.message };
  }

  return data.user
    ? { ok: true, user: data.user, message: "已登录云端账号。" }
    : { ok: false, user: null, message: "请先登录云端账号。" };
}

export async function signUpCloudUser(supabase, email, password) {
  if (!supabase) {
    return { ok: false, message: "Supabase 还没有配置。" };
  }

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "注册请求已提交。如果 Supabase 要求邮箱确认，请先去邮箱完成确认。" };
}

export async function signInCloudUser(supabase, email, password) {
  if (!supabase) {
    return { ok: false, message: "Supabase 还没有配置。" };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "已登录云端账号。" };
}

export async function signOutCloudUser(supabase) {
  if (!supabase) {
    return { ok: false, message: "Supabase 还没有配置。" };
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "已退出云端账号。" };
}

export async function uploadTermsToCloud(supabase, userId, terms) {
  const payload = createCloudBackupPayload(userId, terms);
  const { error } = await supabase
    .from(CLOUD_TABLE)
    .upsert(payload, { onConflict: "owner_id" });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "已上传到云端。" };
}

export async function downloadTermsFromCloud(supabase, userId) {
  const { data, error } = await supabase
    .from(CLOUD_TABLE)
    .select("terms, updated_at")
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, terms: null, message: error.message };
  }

  if (!data) {
    return { ok: false, terms: null, message: "云端还没有这个账号的词条备份。" };
  }

  return {
    ok: true,
    terms: data.terms,
    message: `已从云端恢复，云端更新时间：${new Date(data.updated_at).toLocaleString()}。`
  };
}
