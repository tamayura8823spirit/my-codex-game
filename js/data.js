export const CONDITIONS = [
  { id: 'enemy_near', name: '敵との距離 <' },
  { id: 'hp_lt', name: 'HP <' },
  { id: 'not_hit', name: '被弾していない' },
  { id: 'enemy_attacking', name: '敵が攻撃中' }
];

export const ACTIONS = [
  { id: 'shoot', name: '弾を発射' },
  { id: 'evade', name: '回避移動' },
  { id: 'advance', name: '前進' },
  { id: 'stop', name: '停止' }
];

function randomRule() {
  const c = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
  const a = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  const cParam = ['not_hit', 'enemy_attacking'].includes(c.id)
    ? 0
    : Math.floor(Math.random() * 80) + 20;
  return { condition: c.id, cParam, action: a.id, aParam: 0 };
}

export function generateRandomRules() {
  const count = Math.floor(Math.random() * 3) + 1;
  const rules = [];
  for (let i = 0; i < count; i++) rules.push(randomRule());
  return rules;
}
