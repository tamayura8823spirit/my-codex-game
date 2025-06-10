import { CONDITIONS, ACTIONS, DEFAULT_AIS } from './data.js';

const aiList = [...DEFAULT_AIS];
const rulesDiv = document.getElementById('rules');
const ai1Select = document.getElementById('ai1');
const ai2Select = document.getElementById('ai2');
const logDiv = document.getElementById('battle-log');

function createRuleRow() {
  const div = document.createElement('div');
  div.className = 'rule';

  const cSelect = document.createElement('select');
  CONDITIONS.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    cSelect.appendChild(opt);
  });
  const cParam = document.createElement('input');
  cParam.type = 'number';
  cParam.value = 0;

  const aSelect = document.createElement('select');
  ACTIONS.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = a.name;
    aSelect.appendChild(opt);
  });
  const aParam = document.createElement('input');
  aParam.type = 'number';
  aParam.value = 0;

  div.appendChild(cSelect);
  div.appendChild(cParam);
  div.appendChild(aSelect);
  div.appendChild(aParam);
  rulesDiv.appendChild(div);
}

document.getElementById('add-rule').addEventListener('click', createRuleRow);

document.getElementById('register-ai').addEventListener('click', () => {
  const name = document.getElementById('ai-name').value.trim();
  if (!name) return;
  const ruleEls = rulesDiv.querySelectorAll('.rule');
  const rules = Array.from(ruleEls).map(div => {
    const [cSelect, cParam, aSelect, aParam] = div.children;
    return {
      condition: cSelect.value,
      cParam: Number(cParam.value),
      action: aSelect.value,
      aParam: Number(aParam.value)
    };
  });
  aiList.push({ name, rules });
  updateAISelectors();
  document.getElementById('ai-name').value = '';
  rulesDiv.innerHTML = '';
});

function updateAISelectors() {
  [ai1Select, ai2Select].forEach(sel => {
    sel.innerHTML = '';
    aiList.forEach((ai, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = ai.name;
      sel.appendChild(opt);
    });
  });
}

function log(msg) {
  const p = document.createElement('div');
  p.textContent = msg;
  logDiv.appendChild(p);
  logDiv.scrollTop = logDiv.scrollHeight;
}

function checkCondition(condId, param, self, opp) {
  switch (condId) {
    case 'always':
      return true;
    case 'hp_lt':
      return self.hp < param;
    default:
      return false;
  }
}

function performAction(actId, param, self, opp) {
  switch (actId) {
    case 'attack':
      opp.hp -= param;
      if (opp.hp < 0) opp.hp = 0;
      log(`${self.name} の攻撃! ${opp.name} に ${param} ダメージ`);
      break;
    case 'heal':
      self.hp += param;
      if (self.hp > self.maxHp) self.hp = self.maxHp;
      log(`${self.name} は ${param} 回復`);
      break;
  }
}

function cloneAI(ai) {
  return {
    name: ai.name,
    hp: 100,
    maxHp: 100,
    rules: ai.rules
  };
}

function processTurn(attacker, defender) {
  for (const r of attacker.rules) {
    if (checkCondition(r.condition, r.cParam, attacker, defender)) {
      performAction(r.action, r.aParam, attacker, defender);
      break;
    }
  }
}

function startBattle() {
  logDiv.innerHTML = '';
  const ai1 = cloneAI(aiList[ai1Select.value]);
  const ai2 = cloneAI(aiList[ai2Select.value]);
  log(`--- ${ai1.name} VS ${ai2.name} ---`);
  let turn = 0;
  const interval = setInterval(() => {
    const attacker = turn % 2 === 0 ? ai1 : ai2;
    const defender = turn % 2 === 0 ? ai2 : ai1;
    processTurn(attacker, defender);
    if (ai1.hp <= 0 || ai2.hp <= 0) {
      const winner = ai1.hp <= 0 && ai2.hp <= 0 ? 'Draw' : (ai1.hp > 0 ? ai1.name : ai2.name);
      log(`勝者: ${winner}`);
      clearInterval(interval);
    }
    turn++;
  }, 1000);
}

document.getElementById('start-battle').addEventListener('click', startBattle);

// 初期化
createRuleRow();
updateAISelectors();
