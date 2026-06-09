import { categoryLabels, createTerm, defaultTerms, statusLabels } from "./data.js";
import { filterTerms } from "./filters.js";
import { loadTerms, resetTerms, saveTerms } from "./storage.js";
import { renderTerms } from "./render.js";

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

const state = {
  terms: loadTerms(window.localStorage, defaultTerms),
  category: "all",
  status: "all",
  query: ""
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

termForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validateForm()) {
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
