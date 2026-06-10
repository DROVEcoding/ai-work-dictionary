export const AUTH_SESSION_KEY = "ai-work-dictionary-auth-session-v1";

function normalizeDisplayName(displayName) {
  return displayName.trim().replace(/\s+/g, " ");
}

function createUserId(displayName) {
  return encodeURIComponent(displayName.toLowerCase());
}

export function createLocalUser(displayName) {
  const normalizedName = normalizeDisplayName(displayName);

  if (normalizedName.length < 2 || normalizedName.length > 24) {
    return {
      ok: false,
      user: null,
      message: "请输入 2 到 24 个字符的用户名。"
    };
  }

  return {
    ok: true,
    user: {
      id: createUserId(normalizedName),
      displayName: normalizedName,
      mode: "local-demo"
    },
    message: "已进入本地学习空间。"
  };
}

function isValidSession(session) {
  return Boolean(
    session &&
    typeof session.id === "string" &&
    typeof session.displayName === "string" &&
    session.mode === "local-demo"
  );
}

export function loadSession(storage) {
  try {
    const saved = storage.getItem(AUTH_SESSION_KEY);
    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved);
    return isValidSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSession(storage, user) {
  storage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
}

export function clearSession(storage) {
  storage.removeItem(AUTH_SESSION_KEY);
}
