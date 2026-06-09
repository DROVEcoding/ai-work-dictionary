# AI Learning Dictionary Design

## Goal

Build a small browser-based learning dictionary for a beginner who is learning GitHub, Git, CLI tools, and AI-assisted coding.

The project's teaching goal is more important than feature size. The first version should show the complete project flow:

1. Define the idea.
2. Write a design.
3. Plan implementation.
4. Build the files.
5. Run and inspect the result in a browser.
6. Track changes with Git.
7. Prepare the project for GitHub.

## User Experience

The app is a single web page named "AI 学习词典".

The page includes:

- A title and short description.
- A search input for terms such as "CLI", "Commit", "Skill", and "Vibe Coding".
- Category buttons:
  - 全部
  - GitHub / Git
  - AI 编程
  - 项目流程
- A grid of glossary cards.
- An empty result message when no card matches the current search and category.

Each card shows:

- Term name.
- Category.
- Plain-language explanation.
- The problem the term exists to solve.

## File Structure

The first version uses plain HTML, CSS, and JavaScript:

```text
ai-learning-dictionary/
  index.html
  style.css
  script.js
  README.md
  .gitignore
  docs/
    superpowers/
      specs/
        2026-06-09-ai-learning-dictionary-design.md
```

The files have clear teaching roles:

- `index.html` is the page skeleton.
- `style.css` controls layout, colors, spacing, cards, buttons, and responsive behavior.
- `script.js` stores the term data and handles rendering, search, filtering, and empty states.
- `README.md` explains what the project is, how to open it, and what was learned.
- `.gitignore` keeps temporary local files out of Git.

## Data Model

The glossary data lives in `script.js` as an array of objects.

Each term has:

- `term`: the displayed word.
- `category`: one of `github`, `ai`, or `process`.
- `categoryLabel`: the Chinese category label shown on the card.
- `definition`: a beginner-friendly explanation.
- `solves`: the problem this term exists to solve.

The first version should include about 20 terms:

- 8 GitHub / Git terms.
- 8 AI coding terms.
- 4 project workflow terms.

## Behavior

When the page loads:

1. JavaScript reads the glossary data.
2. It renders all cards.
3. The "全部" category is active.

When the user types in the search box:

1. The app compares the query with each term, definition, category label, and solves text.
2. Matching cards remain visible.
3. Non-matching cards are hidden by re-rendering the visible result list.

When the user clicks a category:

1. The active category changes.
2. The selected category button gets active styling.
3. The card list updates using both the category and the current search text.

When no terms match:

- The page shows a clear empty message.

## Visual Direction

The interface should feel clear, calm, and study-focused.

Style requirements:

- Use a readable Chinese-friendly font stack.
- Use a light background and white cards.
- Keep cards compact and scannable.
- Use color only to help distinguish categories and active controls.
- Support both desktop and mobile screen widths.

## Error Handling and Edge Cases

This is a static web page, so there are no network or server errors.

The app should still handle:

- Empty search text by showing all terms in the selected category.
- Search text with uppercase or lowercase letters.
- Search text with extra spaces.
- No matching results.

## Testing Plan

Manual checks:

- Open `index.html` in a browser.
- Confirm all initial cards appear.
- Search for "CLI" and confirm the CLI card appears.
- Search for a Chinese word such as "分支" and confirm relevant cards appear.
- Click each category and confirm only that category is shown.
- Search within a category and confirm both filters work together.
- Search for a nonsense word and confirm the empty result message appears.
- Resize the browser or inspect on a narrow width to confirm the layout remains readable.

## Out of Scope for Version 1

The first version will not include:

- Login.
- Database.
- Online editing.
- Favorites.
- Dark mode.
- React, Vue, or another front-end framework.
- Backend server.

These are good candidates for later learning versions after the beginner flow is complete.
