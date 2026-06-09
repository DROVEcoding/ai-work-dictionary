import { categoryLabels, createTerm, defaultTerms, statusLabels } from "./data.js";
import { filterTerms } from "./filters.js";
import { loadTerms, resetTerms, saveTerms } from "./storage.js";
import { renderTerms } from "./render.js";
import { updateTermContent } from "./termActions.js";

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

const state = {
  terms: loadTerms(window.localStorage, defaultTerms),
  category: "all",
  status: "all",
  query: "",
  editingTermId: null
};

function setActiveButton(buttons, activeValue, dataName) {
  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset[dataName] === activeValue);
  });
}

function renderApp() {
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
  saveTerms(window.localStorage, state.terms);
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

  state.terms = resetTerms(window.localStorage, defaultTerms);
  showFormMessage("已重置为默认词库。", "success");
  renderApp();
});

renderApp();
