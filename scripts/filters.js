function normalizeText(value = "") {
  return value.trim().toLowerCase();
}

export function filterTerms(terms, filters) {
  const query = normalizeText(filters.query);

  return terms.filter((item) => {
    const matchesCategory = filters.category === "all" || item.category === filters.category;
    const matchesStatus = filters.status === "all" || item.status === filters.status;
    const searchableText = normalizeText(`${item.term} ${item.categoryLabel} ${item.definition} ${item.solves}`);
    const matchesSearch = searchableText.includes(query);

    return matchesCategory && matchesStatus && matchesSearch;
  });
}
