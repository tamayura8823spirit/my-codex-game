import { CONDITIONS, ACTIONS, generateRandomRules } from './data.js';

const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d');
const hp1Span = document.getElementById('hp1');
const hp2Span = document.getElementById('hp2');
const state1Span = document.getElementById('state1');
const state2Span = document.getElementById('state2');

function createRuleRow(container, rule) {
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

  const cLabel = document.createElement('span');
  cLabel.className = 'param-label';

  const aSelect = document.createElement('select');
  ACTIONS.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = a.name;
    aSelect.appendChild(opt);
  });
  const aParam = document.createElement('input');
  aParam.type = 'number';
  const aLabel = document.createElement('span');
  aLabel.className = 'param-label';
  const remove = document.createElement('button');
  remove.textContent = '削除';
  remove.addEventListener('click', () => div.remove());
  if (rule) {
    cSelect.value = rule.condition;
    aSelect.value = rule.action;
    cParam.value = rule.cParam;
    aParam.value = rule.aParam;
  }

  function refreshLabels() {
    const cInfo = CONDITIONS.find(c => c.id === cSelect.value);
    cLabel.textContent = cInfo ? cInfo.paramLabel : '';
    cParam.placeholder = cLabel.textContent;
    const aInfo = ACTIONS.find(a => a.id === aSelect.value);
    aLabel.textContent = aInfo ? aInfo.paramLabel : '';
    aParam.placeholder = aLabel.textContent;
  }
  cSelect.addEventListener('change', refreshLabels);
  aSelect.addEventListener('change', refreshLabels);
  refreshLabels();

  div.appendChild(cSelect);
  div.appendChild(cParam);
  div.appendChild(cLabel);
  div.appendChild(aSelect);
  div.appendChild(aParam);
  div.appendChild(aLabel);
  div.appendChild(remove);

  container.appendChild(div);
}

function applyRandomRules(section) {
  const rulesDiv = section.querySelector('.rules');
  rulesDiv.innerHTML = '';
  const rules = generateRandomRules();
  rules.forEach(r => createRuleRow(rulesDiv, r));
}

function setupSection(section) {
  section.querySelector('.add-rule').addEventListener('click', () => {
    createRuleRow(section.querySelector('.rules'));
  });
  section.querySelector('.random').addEventListener('click', () => {
    applyRandomRules(section);
  });
  applyRandomRules(section);
}

setupSection(document.getElementById('config1'));
setupSection(document.getElementById('config2'));

function getAI(section, name) {
  const rules = Array.from(section.querySelectorAll('.rule')).map(div => {

    const [cSelect, cParam, , aSelect, aParam] = div.children;

    return {
      condition: cSelect.value,
      cParam: Number(cParam.value),
      action: aSelect.value,
      aParam: Number(aParam.value)
    };
  });
  return { name, rules };
}

class Player {
  constructor(name, rules, color, x, y) {
    this.name = name;
    this.rules = rules;
    this.color = color;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.size = 20;
    this.hp = 100;
    this.maxHp = 100;
    this.lastShot = 0;
    this.lastHit = 0;
    this.state = 'idle';

    this.freezeUntil = 0;
    this.nextWander = 0;

  }
  update(dt, enemy, bullets, now) {
    for (const r of this.rules) {
      if (checkCondition(r.condition, r.cParam, this, enemy, now)) {
        performAction(r.action, r.aParam, this, enemy, bullets, now);
        break;
      }
    }

    if (now < this.freezeUntil) {
      this.vx = 0;
      this.vy = 0;
    } else if (this.state !== 'idle') {
      this.state = 'idle';
    } else if (now > this.nextWander) {
      const ang = Math.random() * Math.PI * 2;
      this.vx = Math.cos(ang) * 1.5;
      this.vy = Math.sin(ang) * 1.5;
      this.nextWander = now + 1000 + Math.random() * 1000;
    }


    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const half = this.size / 2;
    this.x = Math.max(half, Math.min(canvas.width - half, this.x));
    this.y = Math.max(half, Math.min(canvas.height - half, this.y));
  }
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
  }
}

function checkCondition(condId, param, self, enemy, now) {
  switch (condId) {

    case 'enemy_hp_lt':
      return enemy.hp < param;
    case 'enemy_near': {
      const dx = self.x - enemy.x;
      const dy = self.y - enemy.y;
      return Math.hypot(dx, dy) < param;
    }
    case 'self_hp_lt':
      return self.hp < param;
    case 'recent_hit':
      return now - self.lastHit <= param;

    default:
      return false;
  }
}

function performAction(actId, param, self, enemy, bullets, now) {
  switch (actId) {
    case 'shoot':
      if (now - self.lastShot > 800) {
        const angle = Math.atan2(enemy.y - self.y, enemy.x - self.x);
        bullets.push({
          x: self.x,
          y: self.y,
          vx: Math.cos(angle) * (param || 4),
          vy: Math.sin(angle) * (param || 4),
          owner: self,
          damage: 5
        });
        self.lastShot = now;
        self.state = 'shoot';

        self.freezeUntil = now + 300;
      }
      break;
    case 'melee': {
      const dist = Math.hypot(self.x - enemy.x, self.y - enemy.y);
      if (dist < 30) {
        enemy.hp -= param || 15;
        if (enemy.hp < 0) enemy.hp = 0;
        enemy.lastHit = now;
      }
      self.state = 'melee';
      self.freezeUntil = now + 300;
      break;
    }
    case 'approach': {
      const angle = Math.atan2(enemy.y - self.y, enemy.x - self.x);
      self.vx = Math.cos(angle) * (param || 2);
      self.vy = Math.sin(angle) * (param || 2);
      self.state = 'approach';
      break;
    }
    case 'retreat': {
      const angle = Math.atan2(self.y - enemy.y, self.x - enemy.x);
      self.vx = Math.cos(angle) * (param || 2);
      self.vy = Math.sin(angle) * (param || 2);
      self.state = 'retreat';
      break;
    }
    case 'wait':
      self.vx = 0;
      self.vy = 0;
      self.state = 'wait';
      self.freezeUntil = now + (param || 500);
      break;
    case 'random': {
      const ang = Math.random() * Math.PI * 2;
      self.vx = Math.cos(ang) * (param || 2);
      self.vy = Math.sin(ang) * (param || 2);
      self.state = 'random';
      break;
    }

  }
}

const bullets = [];
let p1, p2, running = false;
let lastTimestamp = 0;

function updateBullets(dt, now) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      bullets.splice(i, 1);
      continue;
    }
    const target = b.owner === p1 ? p2 : p1;
    if (Math.hypot(b.x - target.x, b.y - target.y) < target.size / 2 + 4) {
      target.hp -= b.damage;
      if (target.hp < 0) target.hp = 0;
      target.lastHit = now;
      bullets.splice(i, 1);
    }
  }
}

function loop(timestamp) {
  if (!running) return;
  if (!lastTimestamp) lastTimestamp = timestamp;
  const dt = (timestamp - lastTimestamp) / 16;
  lastTimestamp = timestamp;
  const now = timestamp;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  p1.update(dt, p2, bullets, now);
  p2.update(dt, p1, bullets, now);
  updateBullets(dt, now);
  p1.draw(ctx);
  p2.draw(ctx);
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();
  });
  hp1Span.textContent = p1.hp;
  hp2Span.textContent = p2.hp;
  state1Span.textContent = p1.state;
  state2Span.textContent = p2.state;
  if (p1.hp <= 0 || p2.hp <= 0) {
    running = false;
    const winner = p1.hp <= 0 && p2.hp <= 0 ? 'DRAW' : (p1.hp > 0 ? p1.name : p2.name);
    document.getElementById('result').textContent = `勝者: ${winner}`;
    document.getElementById('rematch').style.display = 'inline';
    return;
  }
  requestAnimationFrame(loop);
}

function start() {
  document.getElementById('result').textContent = '';
  document.getElementById('rematch').style.display = 'none';
  bullets.length = 0;
  const ai1 = getAI(document.getElementById('config1'), 'AI1');
  const ai2 = getAI(document.getElementById('config2'), 'AI2');
  p1 = new Player('AI1', ai1.rules, 'red', 80, canvas.height / 2);
  p2 = new Player('AI2', ai2.rules, 'blue', canvas.width - 80, canvas.height / 2);
  running = true;
  lastTimestamp = 0;
  requestAnimationFrame(loop);
}

document.getElementById('start').addEventListener('click', start);
document.getElementById('rematch').addEventListener('click', start);
