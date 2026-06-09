export const STORAGE_KEY = "ai-learning-dictionary-v2";

function cloneTerms(terms) {
  return terms.map((term) => ({ ...term }));
}

function isValidTerm(term) {
  return Boolean(
    term &&
    typeof term.id === "string" &&
    typeof term.term === "string" &&
    typeof term.category === "string" &&
    typeof term.categoryLabel === "string" &&
    typeof term.definition === "string" &&
    typeof term.solves === "string" &&
    typeof term.status === "string"
  );
}

export function loadTerms(storage, fallbackTerms) {
  try {
    const saved = storage.getItem(STORAGE_KEY);
    if (!saved) {
      return cloneTerms(fallbackTerms);
    }

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isValidTerm)) {
      return cloneTerms(fallbackTerms);
    }

    return cloneTerms(parsed);
  } catch {
    return cloneTerms(fallbackTerms);
  }
}

export function saveTerms(storage, terms) {
  storage.setItem(STORAGE_KEY, JSON.stringify(terms));
}

export function resetTerms(storage, defaultTerms) {
  const freshTerms = cloneTerms(defaultTerms);
  saveTerms(storage, freshTerms);
  return freshTerms;
}
