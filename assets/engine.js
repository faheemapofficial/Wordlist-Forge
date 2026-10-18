/* Pure generation engine: shared by the Web Worker and Node's test runner. */
(function (root) {
  'use strict';
  const MAX_WORDS = 50000;
  const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
  function generate(config) {
    if (!config || !config.inputs || !config.rules) throw new Error('Missing generation settings.');
    const min = Number(config.min), max = Number(config.max);
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max > 256 || min > max) throw new Error('Use whole-number length limits between 1 and 256, with minimum ≤ maximum.');
    const keys = ['name', 'nick', 'pet', 'comp', 'year'];
    const input = Object.fromEntries(keys.map(key => [key, String(config.inputs[key] || '').trim()]));
    for (const key of keys) {
      if ([...input[key]].length > (key === 'year' ? 8 : 64)) throw new Error('Seed words must be at most 64 characters; numbers at most 8 digits.');
      if (/[\r\n\u0000-\u001f\u007f]/u.test(input[key])) throw new Error('Inputs cannot contain line breaks or control characters.');
    }
    if (input.year && !/^\d{1,8}$/.test(input.year)) throw new Error('Year / number must contain 1–8 digits.');
    const tokens = [...new Set(keys.map(key => input[key]).filter(Boolean))];
    if (!tokens.length) throw new Error('Add at least one seed word, or load the sample.');
    const rules = config.rules;
    const result = new Set();
    let limited = false;
    const reverse = word => [...word].reverse().join('');
    const capitalize = word => { const chars = [...word]; return chars[0].toUpperCase() + chars.slice(1).join('').toLowerCase(); };
    const map = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7', b: '8', g: '9', l: '1', z: '2' };
    const leet = word => [...word].map(c => map[c.toLowerCase()] || c).join('');
    const transforms = [rules.leet && leet, rules.reverse && reverse, rules.capitalize && capitalize].filter(Boolean);
    function add(word) {
      const length = [...word].length;
      if (length < min || length > max || result.has(word)) return;
      if (result.size >= MAX_WORDS) { limited = true; return; }
      result.add(word);
    }
    // Each enabled transform can be applied once, in every ordering.
    function mutate(word, remaining = transforms) {
      add(word);
      for (let i = 0; i < remaining.length; i++) mutate(remaining[i](word), remaining.filter((_, j) => j !== i));
    }
    tokens.forEach(word => mutate(word));
    function pair(a, b) { if (a && b) { mutate(a + b); mutate(b + a); } }
    const { name, nick, pet, comp, year } = input;
    if (rules.appendYear && year) [name, nick, pet, comp].filter(Boolean).forEach(t => mutate(t + year));
    if (rules.yearPrefix && year) [name, nick, pet, comp].filter(Boolean).forEach(t => mutate(year + t));
    if (rules.prependNick) pair(name, nick);
    if (rules.petCombo) [name, nick, comp].forEach(t => pair(pet, t));
    if (rules.companyCombo) [name, nick, pet].forEach(t => pair(comp, t));
    function combine(prefix, remaining, depth) {
      if ((rules.allCombos && depth >= 2) || (rules.tripleCombos && depth === 3)) mutate(prefix);
      if (depth === (rules.allCombos ? 4 : 3)) return;
      remaining.forEach((token, i) => combine(prefix + token, remaining.filter((_, j) => i !== j), depth + 1));
    }
    if (rules.allCombos || rules.tripleCombos) combine('', tokens, 0);
    if (rules.separators) tokens.forEach((a, i) => tokens.forEach((b, j) => { if (i !== j) ['_', '-', '.'].forEach(sep => mutate(a + sep + b)); }));
    if (rules.commonAffixes) tokens.forEach(token => {
      ['123', '456', '789', '2024', '2025', '2026', 'admin', 'root', 'password', '123456', 'qwerty'].forEach(s => { mutate(token + s); mutate(s + token); });
      ['admin_', 'root_', 'user_', 'test_', 'demo_', 'sec_', 'cyber_'].forEach(p => mutate(p + token));
    });
    const words = [...result];
    if (config.sort === 'length') words.sort((a, b) => [...a].length - [...b].length || compare(a, b));
    else words.sort(compare);
    return { words, limited };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { generate, MAX_WORDS };
  else root.ForgeEngine = { generate, MAX_WORDS };
})(typeof self !== 'undefined' ? self : globalThis);
