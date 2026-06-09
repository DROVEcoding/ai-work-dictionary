function createButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

export function renderTerms(grid, terms, options) {
  grid.innerHTML = "";

  terms.forEach((item) => {
    const card = document.createElement("article");
    card.className = "term-card";

    const badge = document.createElement("span");
    badge.className = `category-badge category-${item.category}`;
    badge.textContent = item.categoryLabel;

    const title = document.createElement("h2");
    title.textContent = item.term;

    const definition = document.createElement("p");
    definition.textContent = item.definition;

    const solves = document.createElement("p");
    const solvesLabel = document.createElement("strong");
    solvesLabel.textContent = "解决的问题：";
    solves.append(solvesLabel, item.solves);

    // 学习状态按钮：用户点击后，app.js 会更新数据并重新渲染页面。
    const statusGroup = document.createElement("div");
    statusGroup.className = "card-status-group";
    Object.entries(options.statusLabels).forEach(([status, label]) => {
      const button = createButton(label, `status-pill ${item.status === status ? "active" : ""}`, () => {
        options.onStatusChange(item.id, status);
      });
      statusGroup.append(button);
    });

    const actions = document.createElement("div");
    actions.className = "card-actions";
    actions.append(createButton("删除", "delete-button", () => options.onDelete(item.id)));

    card.append(badge, title, definition, solves, statusGroup, actions);
    grid.append(card);
  });
}
