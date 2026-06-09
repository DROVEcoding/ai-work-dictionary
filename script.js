const terms = [
  { term: "Git", category: "github", categoryLabel: "GitHub / Git", definition: "版本管理工具，用来记录项目每一次变化。", solves: "解决代码改乱后无法回退、多人修改难追踪的问题。" },
  { term: "GitHub", category: "github", categoryLabel: "GitHub / Git", definition: "代码托管和协作平台，可以把项目放到网上。", solves: "解决项目备份、展示、协作和开源发布的问题。" },
  { term: "Repository", category: "github", categoryLabel: "GitHub / Git", definition: "仓库，一个项目的文件和历史记录集合。", solves: "解决项目文件需要集中管理的问题。" },
  { term: "Commit", category: "github", categoryLabel: "GitHub / Git", definition: "一次正式保存的项目版本。", solves: "解决需要知道什么时候改了什么的问题。" },
  { term: "Branch", category: "github", categoryLabel: "GitHub / Git", definition: "分支，在不影响主版本的情况下尝试新功能。", solves: "解决开发新功能时怕破坏稳定版本的问题。" },
  { term: "Pull Request", category: "github", categoryLabel: "GitHub / Git", definition: "请求别人检查并合并代码。", solves: "解决团队协作中代码需要审核的问题。" },
  { term: "Merge", category: "github", categoryLabel: "GitHub / Git", definition: "把一个分支的改动合到另一个分支。", solves: "解决不同开发成果需要汇总的问题。" },
  { term: "Conflict", category: "github", categoryLabel: "GitHub / Git", definition: "冲突，两个改动碰到同一处时 Git 需要人来判断。", solves: "解决系统无法自动决定保留哪段内容的问题。" },
  { term: "CLI", category: "ai", categoryLabel: "AI 编程", definition: "命令行界面，用文字命令操作电脑和开发工具。", solves: "解决图形界面不够自动化、不够精确的问题。" },
  { term: "Skill", category: "ai", categoryLabel: "AI 编程", definition: "AI 的专业能力包，让 AI 按某类任务的流程工作。", solves: "解决 AI 做复杂任务时缺少固定方法的问题。" },
  { term: "Agent", category: "ai", categoryLabel: "AI 编程", definition: "能读文件、改代码、运行命令并持续推进任务的 AI。", solves: "解决 AI 只能聊天、不能真正执行项目步骤的问题。" },
  { term: "Prompt", category: "ai", categoryLabel: "AI 编程", definition: "你给 AI 的任务描述或指令。", solves: "解决 AI 需要知道目标、限制和输出形式的问题。" },
  { term: "Context", category: "ai", categoryLabel: "AI 编程", definition: "AI 当前能看到的信息，包括需求、代码和对话。", solves: "解决 AI 需要根据背景做判断的问题。" },
  { term: "Vibe Coding", category: "ai", categoryLabel: "AI 编程", definition: "用自然语言描述感觉和目标，让 AI 快速生成并迭代代码。", solves: "解决从想法到原型太慢的问题。" },
  { term: "Plugin", category: "ai", categoryLabel: "AI 编程", definition: "给工具或 AI 增加额外能力的扩展。", solves: "解决基础工具能力不够用的问题。" },
  { term: "MCP", category: "ai", categoryLabel: "AI 编程", definition: "模型上下文协议，让 AI 更标准地连接外部工具和数据。", solves: "解决 AI 连接工具方式混乱、不统一的问题。" },
  { term: "MVP", category: "process", categoryLabel: "项目流程", definition: "最小可用产品，先做最核心的一版。", solves: "解决一开始想做太多导致迟迟做不完的问题。" },
  { term: "Prototype", category: "process", categoryLabel: "项目流程", definition: "原型，用来快速验证想法的早期版本。", solves: "解决还没确定方向就投入太多开发成本的问题。" },
  { term: "Deploy", category: "process", categoryLabel: "项目流程", definition: "部署，把项目发布到别人可以访问的地方。", solves: "解决项目只在自己电脑上能看的问题。" },
  { term: "README", category: "process", categoryLabel: "项目流程", definition: "项目说明书，介绍项目是什么、怎么使用。", solves: "解决别人打开项目不知道从哪里开始的问题。" }
];

const grid = document.querySelector("#dictionaryGrid");
const searchInput = document.querySelector("#searchInput");
const filterButtons = document.querySelectorAll(".filter-button");
const emptyState = document.querySelector("#emptyState");
const termCount = document.querySelector("#termCount");

let activeCategory = "all";

function normalizeText(value) {
  return value.trim().toLowerCase();
}

function getVisibleTerms() {
  const query = normalizeText(searchInput.value);

  return terms.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const searchableText = normalizeText(`${item.term} ${item.categoryLabel} ${item.definition} ${item.solves}`);
    const matchesSearch = searchableText.includes(query);
    return matchesCategory && matchesSearch;
  });
}

function renderTerms() {
  const visibleTerms = getVisibleTerms();

  grid.innerHTML = visibleTerms.map((item) => `
    <article class="term-card">
      <span class="category-badge category-${item.category}">${item.categoryLabel}</span>
      <h2>${item.term}</h2>
      <p>${item.definition}</p>
      <p><strong>解决的问题：</strong>${item.solves}</p>
    </article>
  `).join("");

  emptyState.hidden = visibleTerms.length > 0;
  termCount.textContent = terms.length;
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderTerms();
  });
});

searchInput.addEventListener("input", renderTerms);

renderTerms();
