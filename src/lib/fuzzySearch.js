// Fuzzy search helpers: tolerate punctuation (Buster's → busters), spacing,
// and small typos (bsters → busters), while still supporting plain substrings.

// Lowercase, drop accents and apostrophes, turn punctuation into spaces.
export function normalizeText(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Levenshtein distance with an early bail-out once `max` is exceeded.
function editDistance(a, b, max) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;

  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

// How many typos we forgive, based on how long the search word is.
function toleranceFor(len) {
  if (len <= 3) return 0;
  if (len <= 6) return 1;
  return 2;
}

// Does a single search token appear in the (already normalized) text,
// either as a substring or as a close match to one of its words?
function tokenMatches(token, text) {
  if (!text) return false;
  if (text.includes(token)) return true;

  const max = toleranceFor(token.length);
  if (max === 0) return false;

  const words = text.split(' ');
  for (const word of words) {
    if (Math.abs(word.length - token.length) > max) continue;
    if (editDistance(token, word, max) <= max) return true;
  }
  return false;
}

/**
 * Match a search query against a record.
 * @param {string} query - raw search text
 * @param {Array<string>} substringFields - fields matched with plain substring
 * @param {Array<string>} [fuzzyFields] - fields that additionally allow typos
 *   (usually names/addresses, to avoid loose matches in long descriptions)
 */
export function matchesSearch(query, substringFields, fuzzyFields = []) {
  const q = normalizeText(query);
  if (!q) return true;

  const tokens = q.split(' ').filter(Boolean);
  const subTexts = substringFields.filter(Boolean).map(normalizeText);
  const fuzzyTexts = fuzzyFields.filter(Boolean).map(normalizeText);

  return tokens.every((token) =>
    subTexts.some((t) => t.includes(token)) ||
    fuzzyTexts.some((t) => tokenMatches(token, t))
  );
}