export const CONDITIONS = [
  { id: 'enemy_hp_lt', name: '敵のHP <', paramLabel: 'HP値' },
  { id: 'enemy_near', name: '敵との距離 <', paramLabel: '距離(px)' },
  { id: 'self_hp_lt', name: '自分のHP <', paramLabel: 'HP値' },
  { id: 'recent_hit', name: '最近被弾した', paramLabel: '経過ms' }
];

export const ACTIONS = [
  { id: 'shoot', name: '弾を撃つ', paramLabel: '弾速' },
  { id: 'melee', name: '近接攻撃', paramLabel: 'ダメージ' },
  { id: 'approach', name: '敵に近づく', paramLabel: '速度' },
  { id: 'retreat', name: '敵から離れる', paramLabel: '速度' },
  { id: 'wait', name: '待機', paramLabel: 'ms' },
  { id: 'random', name: 'ランダム移動', paramLabel: '速度' }
];

function randomRule() {
  const c = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
  const a = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  const cParam = c.id === 'recent_hit' ? 1000 : Math.floor(Math.random() * 50) + 20;
  const aParam = a.id === 'shoot' ? 6 : a.id === 'melee' ? 15 : 2;
  return { condition: c.id, cParam, action: a.id, aParam };
}

export function generateRandomRules() {
  const count = Math.floor(Math.random() * 3) + 1;
  const rules = [];
  for (let i = 0; i < count; i++) rules.push(randomRule());
  return rules;
}
