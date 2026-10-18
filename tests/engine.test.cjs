const test = require('node:test');
const assert = require('node:assert/strict');
const { generate } = require('../assets/engine.js');
const config = (overrides = {}) => ({ inputs: { name: 'nova' }, rules: {}, min: 1, max: 256, sort: 'alpha', ...overrides });
test('no hidden mutations with every rule off', () => assert.deepEqual(generate(config()).words, ['nova']));
test('deduplicates seed inputs', () => assert.deepEqual(generate(config({ inputs: { name: 'nova', nick: 'nova' } })).words, ['nova']));
test('individual text transforms', () => {
  const words = generate(config({ rules: { leet: true, capitalize: true, reverse: true } })).words;
  for (const candidate of ['nova', 'n0v4', 'Nova', 'avon', '4v0n']) assert.ok(words.includes(candidate));
  assert.equal(words.length, new Set(words).size);
});
test('year prefix and suffix are independent', () => {
  const c = config({ inputs: { name: 'nova', year: '2026' }, rules: { appendYear: true } });
  assert.ok(generate(c).words.includes('nova2026')); assert.ok(!generate(c).words.includes('2026nova'));
  c.rules = { yearPrefix: true }; assert.ok(generate(c).words.includes('2026nova')); assert.ok(!generate(c).words.includes('nova2026'));
});
test('each pair rule is independent', () => {
  for (const [rule, inputs, expected] of [['prependNick', { name: 'a', nick: 'b' }, 'ab'], ['petCombo', { name: 'a', pet: 'b' }, 'ab'], ['companyCombo', { name: 'a', comp: 'b' }, 'ab']]) assert.ok(generate(config({ rules: { [rule]: true }, inputs })).words.includes(expected));
});
test('all combinations include ordered pairs through quadruples only', () => {
  const words = generate(config({ inputs: { name: 'a', nick: 'b', pet: 'c', comp: 'd', year: '1' }, rules: { allCombos: true } })).words;
  for (const candidate of ['ab', 'ba', 'abc', 'dcba']) assert.ok(words.includes(candidate));
  assert.ok(!words.includes('abcd1')); assert.ok(!words.includes('aa'));
});
test('triple rule excludes pairs', () => {
  const words = generate(config({ inputs: { name: 'a', nick: 'b', pet: 'c' }, rules: { tripleCombos: true } })).words;
  assert.ok(words.includes('abc')); assert.ok(words.includes('cba')); assert.ok(!words.includes('ab'));
});
test('separators and common affixes are opt-in', () => {
  const inputs = { name: 'nova', nick: 'lab' };
  assert.ok(!generate(config({ inputs })).words.includes('nova_lab'));
  const words = generate(config({ inputs, rules: { separators: true, commonAffixes: true } })).words;
  for (const word of ['nova_lab', 'lab.nova', 'nova-lab', 'nova123', 'test_nova']) assert.ok(words.includes(word));
});
test('length filtering uses Unicode code points', () => {
  assert.deepEqual(generate(config({ inputs: { name: '😀a' }, min: 2, max: 2, rules: { reverse: true } })).words, ['a😀', '😀a']);
  assert.deepEqual(generate(config({ min: 8 })).words, []);
});
test('length sort is deterministic', () => assert.deepEqual(generate(config({ inputs: { name: 'bbb', nick: 'a', pet: 'cc' }, sort: 'length' })).words, ['a', 'cc', 'bbb']));
test('rejects empty, control, oversized, and invalid numeric inputs', () => {
  for (const inputs of [{}, { name: 'a\nb' }, { name: 'a'.repeat(65) }, { year: 'abcd' }, { year: '123456789' }]) assert.throws(() => generate(config({ inputs })));
});
test('rejects invalid limits', () => { for (const limits of [{ min: 5, max: 2 }, { min: 0 }, { max: 257 }, { min: 1.5 }]) assert.throws(() => generate(config(limits))); });
test('large configuration remains bounded, unique, and filtered', () => {
  const rules = Object.fromEntries(['leet','capitalize','reverse','appendYear','yearPrefix','prependNick','petCombo','companyCombo','allCombos','tripleCombos','separators','commonAffixes'].map(k => [k,true]));
  const {words} = generate(config({ inputs: { name: 'nova', nick: 'orbit', pet: 'luna', comp: 'lab', year: '2026' }, rules, min: 5, max: 20 }));
  assert.ok(words.length > 1000 && words.length <= 50000); assert.equal(new Set(words).size, words.length); assert.ok(words.every(w => w.length >= 5 && w.length <= 20));
});
