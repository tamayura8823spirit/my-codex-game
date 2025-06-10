export const CONDITIONS = [
  { id: 'always', name: '常に' },
  { id: 'hp_lt', name: '自HP <' }
];

export const ACTIONS = [
  { id: 'attack', name: '攻撃' },
  { id: 'heal', name: '回復' }
];

export const DEFAULT_AIS = [
  {
    name: 'Aggressor',
    rules: [
      { condition: 'always', cParam: 0, action: 'attack', aParam: 10 }
    ]
  },
  {
    name: 'Healer',
    rules: [
      { condition: 'hp_lt', cParam: 50, action: 'heal', aParam: 10 },
      { condition: 'always', cParam: 0, action: 'attack', aParam: 5 }
    ]
  }
];
