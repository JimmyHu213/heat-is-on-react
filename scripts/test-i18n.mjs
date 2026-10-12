import test from 'node:test';
import assert from 'node:assert/strict';
import { translate, setLanguage, getLanguage, townLabel } from '../src/i18n/index.js';
import zh from '../src/i18n/zh.js';

const placeholders = message => [...message.matchAll(/\{(\d+)\}/g)].map(match => match[1]).sort();
test('every translated message preserves its interpolation fields', () => {
  for (const [message, translated] of Object.entries(zh)) {
    assert.deepEqual(placeholders(translated), placeholders(message), message);
  }
});
test('interpolation follows Chinese word order and preserves numeric game values', () => {
  assert.equal(translate('{0} applied to {1} (−{2} EP)', 'zh', ['景观规划', '城镇 1', 15]), '已为城镇 1使用“景观规划”（−15 EP）');
  assert.equal(translate('Round {0} of {1} · Year {2}', 'en', [2, 5, 2052]), 'Round 2 of 5 · Year 2052');
  assert.equal(translate('Round {0} of {1} · Year {2}', 'zh', [2, 5, 2052]), '第 2 / 5 回合 · 2052 年');
});
test('language changes validate choices, translate preset towns and preserve custom town names', () => {
  setLanguage('zh');
  const town = { name: 'Town 1', townNumber: 1, effortPoints: 70 };
  assert.equal(townLabel(town), '城镇 1');
  assert.equal(townLabel({ name: 'Flood', townNumber: 1 }), 'Flood');
  assert.equal(townLabel({ name: '我的城镇', townNumber: 1 }), '我的城镇');
  assert.deepEqual(town, { name: 'Town 1', townNumber: 1, effortPoints: 70 });
  setLanguage('invalid'); assert.equal(getLanguage(), 'zh');
  setLanguage('en'); assert.equal(townLabel(town), 'Town 1');
});
test('unknown text and text-fragment spacing are preserved in both languages', () => {
  assert.equal(translate('  New Game ', 'zh'), '  新建游戏 ');
  assert.equal(translate(' ', 'zh'), ' ');
  assert.equal(translate('My workshop <demo>', 'zh'), 'My workshop <demo>');
});
