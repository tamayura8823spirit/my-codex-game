export const CONDITIONS = [
  { id: 'enemy_hp_lt', name: '敵のHP <', paramLabels: ['HP値'] },
  { id: 'enemy_near', name: '敵との距離 <', paramLabels: ['距離(px)'] },
  { id: 'enemy_far', name: '敵との距離 >', paramLabels: ['距離(px)'] },
  { id: 'self_hp_lt', name: '自分のHP <', paramLabels: ['HP値'] },
  { id: 'recent_hit', name: '最近被弾した', paramLabels: ['経過ms'] },
  { id: 'always', name: '常に', paramLabels: [] },
  { id: 'random_cond', name: 'ランダムに', paramLabels: [] }
];

export const ACTIONS = [
  { id: 'shoot', name: '弾を撃つ', paramLabels: ['弾速', 'クールダウン(ms)'] },
  { id: 'melee', name: '近接攻撃', paramLabels: ['ダメージ', 'クールダウン(ms)'] },
  { id: 'approach', name: '敵に近づく', paramLabels: ['速度'] },
  { id: 'retreat', name: '敵から離れる', paramLabels: ['速度'] },
  { id: 'wait', name: '待機', paramLabels: ['ms'] },
  { id: 'random', name: 'ランダム移動', paramLabels: ['速度'] },
  { id: 'move_up', name: '敵から見て上へ移動', paramLabels: ['距離(px)', '速度'] },
  { id: 'move_down', name: '敵から見て下へ移動', paramLabels: ['距離(px)', '速度'] },
  { id: 'move_left', name: '敵から見て左へ移動', paramLabels: ['距離(px)', '速度'] },
  { id: 'move_right', name: '敵から見て右へ移動', paramLabels: ['距離(px)', '速度'] },
  { id: 'heal', name: '回復', paramLabels: ['回復量', 'クールダウン(ms)'] },
  { id: 'guard', name: 'ガード', paramLabels: ['持続ms', 'クールダウン(ms)'] }
];

function randomRule() {
  const c = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
  const a = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  const cParams = c.paramLabels.map(() => Math.floor(Math.random() * 50) + 20);
  const aParams = a.paramLabels.map(() => 5);
  return { condition: c.id, cParams, action: a.id, aParams };
}

export function generateRandomRules() {
  const count = Math.floor(Math.random() * 3) + 1;
  const rules = [];
  for (let i = 0; i < count; i++) rules.push(randomRule());
  return rules;
}
