export const categoryLabels = {
  github: "GitHub / Git",
  ai: "AI 编程",
  process: "项目流程"
};

export const statusLabels = {
  unknown: "不会",
  learning: "在学",
  known: "已会"
};

function createDefaultTerm(id, term, category, definition, solves) {
  return {
    id,
    term,
    category,
    categoryLabel: categoryLabels[category],
    definition,
    solves,
    status: "unknown",
    isDefault: true
  };
}

export const defaultTerms = [
  createDefaultTerm("default-git", "Git", "github", "版本管理工具，用来记录项目每一次变化。", "解决代码改乱后无法回退、多人修改难追踪的问题。"),
  createDefaultTerm("default-github", "GitHub", "github", "代码托管和协作平台，可以把项目放到网上。", "解决项目备份、展示、协作和开源发布的问题。"),
  createDefaultTerm("default-repository", "Repository", "github", "仓库，一个项目的文件和历史记录集合。", "解决项目文件需要集中管理的问题。"),
  createDefaultTerm("default-commit", "Commit", "github", "一次正式保存的项目版本。", "解决需要知道什么时候改了什么的问题。"),
  createDefaultTerm("default-branch", "Branch", "github", "分支，在不影响主版本的情况下尝试新功能。", "解决开发新功能时怕破坏稳定版本的问题。"),
  createDefaultTerm("default-pull-request", "Pull Request", "github", "请求别人检查并合并代码。", "解决团队协作中代码需要审核的问题。"),
  createDefaultTerm("default-merge", "Merge", "github", "把一个分支的改动合到另一个分支。", "解决不同开发成果需要汇总的问题。"),
  createDefaultTerm("default-conflict", "Conflict", "github", "冲突，两个改动碰到同一处时 Git 需要人来判断。", "解决系统无法自动决定保留哪段内容的问题。"),
  createDefaultTerm("default-cli", "CLI", "ai", "命令行界面，用文字命令操作电脑和开发工具。", "解决图形界面不够自动化、不够精确的问题。"),
  createDefaultTerm("default-skill", "Skill", "ai", "AI 的专业能力包，让 AI 按某类任务的流程工作。", "解决 AI 做复杂任务时缺少固定方法的问题。"),
  createDefaultTerm("default-agent", "Agent", "ai", "能读文件、改代码、运行命令并持续推进任务的 AI。", "解决 AI 只能聊天、不能真正执行项目步骤的问题。"),
  createDefaultTerm("default-prompt", "Prompt", "ai", "你给 AI 的任务描述或指令。", "解决 AI 需要知道目标、限制和输出形式的问题。"),
  createDefaultTerm("default-context", "Context", "ai", "AI 当前能看到的信息，包括需求、代码和对话。", "解决 AI 需要根据背景做判断的问题。"),
  createDefaultTerm("default-vibe-coding", "Vibe Coding", "ai", "用自然语言描述感觉和目标，让 AI 快速生成并迭代代码。", "解决从想法到原型太慢的问题。"),
  createDefaultTerm("default-plugin", "Plugin", "ai", "给工具或 AI 增加额外能力的扩展。", "解决基础工具能力不够用的问题。"),
  createDefaultTerm("default-mcp", "MCP", "ai", "模型上下文协议，让 AI 更标准地连接外部工具和数据。", "解决 AI 连接工具方式混乱、不统一的问题。"),
  createDefaultTerm("default-mvp", "MVP", "process", "最小可用产品，先做最核心的一版。", "解决一开始想做太多导致迟迟做不完的问题。"),
  createDefaultTerm("default-prototype", "Prototype", "process", "原型，用来快速验证想法的早期版本。", "解决还没确定方向就投入太多开发成本的问题。"),
  createDefaultTerm("default-deploy", "Deploy", "process", "部署，把项目发布到别人可以访问的地方。", "解决项目只在自己电脑上能看的问题。"),
  createDefaultTerm("default-readme", "README", "process", "项目说明书，介绍项目是什么、怎么使用。", "解决别人打开项目不知道从哪里开始的问题。")
];

export function createTerm({ term, category, definition, solves }) {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    term: term.trim(),
    category,
    categoryLabel: categoryLabels[category],
    definition: definition.trim(),
    solves: solves.trim(),
    status: "unknown",
    isDefault: false
  };
}
