import { categoryLabels, createTerm, defaultTerms, statusLabels } from "./data.js";
import { filterTerms } from "./filters.js";
import { clearSession, createLocalUser, loadSession, saveSession } from "./auth.js";
import { exportTermsBackup, importTermsBackup, loadTerms, resetTerms, saveTerms } from "./storage.js";
import { renderTerms } from "./render.js";
import { updateTermContent } from "./termActions.js";

const loginForm = document.querySelector("#loginForm");
const usernameInput = document.querySelector("#usernameInput");
const authSession = document.querySelector("#authSession");
const userDisplay = document.querySelector("#userDisplay");
const logoutButton = document.querySelector("#logoutButton");
const loginMessage = document.querySelector("#loginMessage");
const grid = document.querySelector("#dictionaryGrid");
const searchInput = document.querySelector("#searchInput");
const categoryButtons = document.querySelectorAll("[data-category]");
const statusButtons = document.querySelectorAll("[data-status]");
const emptyState = document.querySelector("#emptyState");
const termCount = document.querySelector("#termCount");
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

const state = {
  currentUser: loadSession(window.localStorage),
  terms: [],
  category: "all",
  status: "all",
  query: "",
  editingTermId: null
};

state.terms = loadTerms(window.localStorage, defaultTerms, state.currentUser?.id);

function setActiveButton(buttons, activeValue, dataName) {
  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset[dataName] === activeValue);
  });
}

function renderApp() {
  renderAuth();

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
}

function persistAndRender() {
  saveTerms(window.localStorage, state.terms, state.currentUser?.id);
  renderApp();
}

function showLoginMessage(message, type = "error") {
  loginMessage.textContent = message;
  loginMessage.dataset.type = type;
  loginMessage.hidden = !message;
}

function renderAuth() {
  const isLoggedIn = Boolean(state.currentUser);
  loginForm.hidden = isLoggedIn;
  authSession.hidden = !isLoggedIn;
  userDisplay.textContent = isLoggedIn
    ? `当前用户：${state.currentUser.displayName}`
    : "";
}

function switchUser(user) {
  state.currentUser = user;
  state.terms = loadTerms(window.localStorage, defaultTerms, state.currentUser?.id);
  exitEditMode();
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

  state.terms = resetTerms(window.localStorage, defaultTerms, state.currentUser?.id);
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
  saveTerms(window.localStorage, state.terms, state.currentUser?.id);
  exitEditMode();
  renderApp();
  showBackupMessage(`导入成功，共恢复 ${state.terms.length} 个词条。`, "success");
  importInput.value = "";
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const result = createLocalUser(usernameInput.value);
  if (!result.ok) {
    showLoginMessage(result.message);
    return;
  }

  saveSession(window.localStorage, result.user);
  usernameInput.value = "";
  showLoginMessage(`已进入 ${result.user.displayName} 的本地学习空间。`, "success");
  switchUser(result.user);
});

logoutButton.addEventListener("click", () => {
  clearSession(window.localStorage);
  showLoginMessage("已退出本地学习账号。", "success");
  switchUser(null);
});

// Service Worker 让网页具备离线缓存能力。失败时不影响正常在线使用。
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(() => {
    showBackupMessage("离线缓存暂时不可用，但在线功能不受影响。");
  });
}

renderApp();
