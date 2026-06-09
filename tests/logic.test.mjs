import test from "node:test";
import assert from "node:assert/strict";

import { createTerm, defaultTerms } from "../scripts/data.js";
import { filterTerms } from "../scripts/filters.js";
import { loadTerms, saveTerms, resetTerms } from "../scripts/storage.js";

function createFakeStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    }
  };
}

test("默认词库包含 20 个带学习状态的词条", () => {
  assert.equal(defaultTerms.length, 20);
  assert.ok(defaultTerms.every((term) => term.id && term.status === "unknown" && term.isDefault === true));
});

test("筛选逻辑可以同时处理搜索、分类和学习状态", () => {
  const terms = [
    { term: "CLI", category: "ai", categoryLabel: "AI 编程", definition: "命令行", solves: "自动化", status: "known" },
    { term: "Branch", category: "github", categoryLabel: "GitHub / Git", definition: "分支", solves: "隔离开发", status: "unknown" },
    { term: "MVP", category: "process", categoryLabel: "项目流程", definition: "最小可用产品", solves: "验证想法", status: "learning" }
  ];

  const result = filterTerms(terms, {
    query: "cli",
    category: "ai",
    status: "known"
  });

  assert.deepEqual(result.map((item) => item.term), ["CLI"]);
});

test("本地保存可以读取有效数据，并在数据损坏时回到默认词库", () => {
  const storage = createFakeStorage();
  const customTerm = createTerm({
    term: "localStorage",
    category: "ai",
    definition: "浏览器本地保存",
    solves: "刷新后保留数据"
  });

  saveTerms(storage, [customTerm]);
  assert.equal(loadTerms(storage, defaultTerms)[0].term, "localStorage");

  storage.setItem("ai-learning-dictionary-v2", "{bad json");
  assert.equal(loadTerms(storage, defaultTerms).length, defaultTerms.length);
});

test("重置会把保存内容恢复为默认词库", () => {
  const storage = createFakeStorage();
  resetTerms(storage, defaultTerms);

  const loaded = loadTerms(storage, []);
  assert.equal(loaded.length, 20);
  assert.equal(loaded[0].status, "unknown");
});
