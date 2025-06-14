import { CONDITIONS, ACTIONS, generateRandomRules } from './data.js';

const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d');
const hp1Span = document.getElementById('hp1');
const hp2Span = document.getElementById('hp2');
const state1Span = document.getElementById('state1');
const state2Span = document.getElementById('state2');
const inertiaCheckbox = document.getElementById('inertia');


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
  const cParamWrap = document.createElement('span');

  const aSelect = document.createElement('select');
  ACTIONS.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = a.name;
    aSelect.appendChild(opt);
  });
  const aParamWrap = document.createElement('span');
  const remove = document.createElement('button');
  remove.textContent = '削除';
  remove.addEventListener('click', () => div.remove());

  let cInputs = [], aInputs = [];
  function buildInputs(info, wrap, values) {
    wrap.innerHTML = '';
    const arr = [];
    (info.paramLabels || []).forEach((lab, i) => {
      const input = document.createElement('input');
      input.type = 'number';
      input.placeholder = lab;
      input.value = values && values[i] != null ? values[i] : '';
      const label = document.createElement('span');
      label.className = 'param-label';
      label.textContent = lab;
      wrap.appendChild(input);
      wrap.appendChild(label);
      arr.push(input);
    });
    return arr;
  }

  function refreshCond(values) {
    const info = CONDITIONS.find(c => c.id === cSelect.value);
    cInputs = buildInputs(info, cParamWrap, values);
  }

  function refreshAct(values) {
    const info = ACTIONS.find(a => a.id === aSelect.value);
    aInputs = buildInputs(info, aParamWrap, values);
  }

  cSelect.addEventListener('change', () => refreshCond());
  aSelect.addEventListener('change', () => refreshAct());

  if (rule) {
    cSelect.value = rule.condition;
    aSelect.value = rule.action;
  }
  refreshCond(rule ? rule.cParams : []);
  refreshAct(rule ? rule.aParams : []);

  div.appendChild(cSelect);
  div.appendChild(cParamWrap);
  div.appendChild(aSelect);
  div.appendChild(aParamWrap);
  div.appendChild(remove);

  div.getValues = () => ({
    condition: cSelect.value,
    cParams: cInputs.map(i => Number(i.value)),
    action: aSelect.value,
    aParams: aInputs.map(i => Number(i.value))
  });


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
  const rules = Array.from(section.querySelectorAll('.rule')).map(div => div.getValues());
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
    this.lastMelee = 0;
    this.lastHeal = 0;
    this.lastGuard = 0;
    this.lastHit = 0;
    this.guardUntil = 0;
    this.meleeShowUntil = 0;
    this.state = 'idle';
    this.freezeUntil = 0;
    this.keepRange = false;
    this.lastDecision = 0;
    this.moveEnd = 0;
    this.waitUntil = 0;

  }
  update(dt, enemy, bullets, now) {
    for (const r of this.rules) {
      if (checkCondition(r.condition, r.cParams, this, enemy, now)) {
        performAction(r.action, r.aParams, this, enemy, bullets, now);
        break;
      }
    }
    if (now < this.freezeUntil) {
      this.vx = 0;
      this.vy = 0;
    } else if (this.keepRange) {
      maintainRange(this, enemy, now);

    } else {
      this.vx *= inertiaCheckbox.checked ? 0.9 : 0;
      this.vy *= inertiaCheckbox.checked ? 0.9 : 0;
      if (!inertiaCheckbox.checked) {
        this.state = 'idle';
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const half = this.size / 2;
    if (this.x < half || this.x > canvas.width - half) this.vx *= -1;
    if (this.y < half || this.y > canvas.height - half) this.vy *= -1;

    this.x = Math.max(half, Math.min(canvas.width - half, this.x));
    this.y = Math.max(half, Math.min(canvas.height - half, this.y));
  }
  draw(ctx, now) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    if (this.guardUntil > now) {
      ctx.strokeStyle = '#0af';
      ctx.lineWidth = 3;
      ctx.strokeRect(this.x - this.size / 2 - 2, this.y - this.size / 2 - 2, this.size + 4, this.size + 4);
    }
    if (this.state === 'heal' && this.freezeUntil > now) {
      ctx.fillStyle = 'rgba(0,255,0,0.3)';
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }
    if (this.meleeShowUntil > now) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, 90, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,0,0,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function maintainRange(self, enemy, now) {
  if (now < self.moveEnd) {
    self.state = 'keep_range';
    return;
  }
  if (now < self.waitUntil) {
    self.vx = 0;
    self.vy = 0;
    self.state = 'wait';
    return;
  }

  if (now - self.lastDecision < 1000) {
    return;
  }

  self.lastDecision = now;
  const dx = enemy.x - self.x;
  const dy = enemy.y - self.y;
  const dist = Math.hypot(dx, dy);
  let angle = Math.atan2(dy, dx);
  if (dist < 100) {
    angle += Math.PI; // retreat
  } else if (dist > 160) {
    // approach, angle stays
  } else {
    const r = Math.random();
    if (r < 0.4) angle += Math.PI / 2; // strafe left
    else if (r < 0.8) angle -= Math.PI / 2; // strafe right
    else {
      self.vx = 0;
      self.vy = 0;
      self.state = 'wait';
      self.moveEnd = now;
      self.waitUntil = now + 500;
      return;
    }
  }
  angle += (Math.random() - 0.5) * 0.4;
  const speed = 2 + Math.random();
  self.vx = Math.cos(angle) * speed;
  self.vy = Math.sin(angle) * speed;
  self.state = 'keep_range';
  self.moveEnd = now + 500;
  self.waitUntil = self.moveEnd + 500;

}

function checkCondition(condId, params, self, enemy, now) {
  const p0 = params[0];
  switch (condId) {
    case 'enemy_hp_lt':
      return enemy.hp < p0;
    case 'enemy_near': {
      const dx = self.x - enemy.x;
      const dy = self.y - enemy.y;
      return Math.hypot(dx, dy) < p0;
    }
    case 'enemy_far': {
      const dx = self.x - enemy.x;
      const dy = self.y - enemy.y;
      return Math.hypot(dx, dy) >= p0;
    }
    case 'self_hp_lt':
      return self.hp < p0;
    case 'recent_hit':
      return now - self.lastHit <= p0;
    case 'always':
      return true;
    case 'random_cond':
      return Math.random() < 0.5;

    default:
      return false;
  }
}

function performAction(actId, params, self, enemy, bullets, now) {
  const p0 = params[0];
  const p1 = params[1];
  switch (actId) {
    case 'shoot':
      if (now - self.lastShot > (p1 || 800)) {

        const angle = Math.atan2(enemy.y - self.y, enemy.x - self.x);
        bullets.push({
          x: self.x,
          y: self.y,
          vx: Math.cos(angle) * (p0 || 4),
          vy: Math.sin(angle) * (p0 || 4),

          owner: self,
          damage: 5
        });
        self.lastShot = now;
        self.state = 'shoot';

        self.freezeUntil = now + 300;
      }
      break;
    case 'melee': {
      if (now - self.lastMelee > (p1 || 800)) {
        const dist = Math.hypot(self.x - enemy.x, self.y - enemy.y);
        if (dist < 90) {
          if (enemy.guardUntil < now) {
            enemy.hp -= p0 || 15;
            if (enemy.hp < 0) enemy.hp = 0;
            enemy.lastHit = now;
          }
        }
        self.lastMelee = now;
        self.meleeShowUntil = now + 200;

      }
      self.state = 'melee';
      self.freezeUntil = now + 300;
      break;
    }
    case 'approach': {
      const angle = Math.atan2(enemy.y - self.y, enemy.x - self.x);
      self.vx = Math.cos(angle) * (p0 || 2);
      self.vy = Math.sin(angle) * (p0 || 2);

      self.state = 'approach';
      break;
    }
    case 'retreat': {
      const angle = Math.atan2(self.y - enemy.y, self.x - enemy.x);
      self.vx = Math.cos(angle) * (p0 || 2);
      self.vy = Math.sin(angle) * (p0 || 2);

      self.state = 'retreat';
      break;
    }
    case 'wait':
      self.vx = 0;
      self.vy = 0;
      self.state = 'wait';
      self.freezeUntil = now + (p0 || 500);
      break;
    case 'random': {
      const ang = Math.random() * Math.PI * 2;
      self.vx = Math.cos(ang) * (p0 || 2);
      self.vy = Math.sin(ang) * (p0 || 2);
      self.state = 'random';
      break;
    }
    case 'move_up': {
      const tx = enemy.x;
      const ty = enemy.y - (p0 || 50);
      const ang = Math.atan2(ty - self.y, tx - self.x);
      self.vx = Math.cos(ang) * (p1 || 2);
      self.vy = Math.sin(ang) * (p1 || 2);
      self.state = 'move';
      break;
    }
    case 'move_down': {
      const tx = enemy.x;
      const ty = enemy.y + (p0 || 50);
      const ang = Math.atan2(ty - self.y, tx - self.x);
      self.vx = Math.cos(ang) * (p1 || 2);
      self.vy = Math.sin(ang) * (p1 || 2);
      self.state = 'move';
      break;
    }
    case 'move_left': {
      const tx = enemy.x - (p0 || 50);
      const ty = enemy.y;
      const ang = Math.atan2(ty - self.y, tx - self.x);
      self.vx = Math.cos(ang) * (p1 || 2);
      self.vy = Math.sin(ang) * (p1 || 2);
      self.state = 'move';
      break;
    }
    case 'move_right': {
      const tx = enemy.x + (p0 || 50);
      const ty = enemy.y;
      const ang = Math.atan2(ty - self.y, tx - self.x);
      self.vx = Math.cos(ang) * (p1 || 2);
      self.vy = Math.sin(ang) * (p1 || 2);
      self.state = 'move';
      break;
    }
    case 'heal':
      if (now - self.lastHeal > (p1 || 1000)) {
        self.hp = Math.min(self.maxHp, self.hp + (p0 || 10));
        self.lastHeal = now;
        self.state = 'heal';
        self.freezeUntil = now + 500;
      }
      break;
    case 'guard':
      if (now - self.lastGuard > (p1 || 1000)) {
        self.guardUntil = now + (p0 || 500);
        self.lastGuard = now;
        self.state = 'guard';
      }
      break;
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
      if (target.guardUntil < now) {
        target.hp -= b.damage;
        if (target.hp < 0) target.hp = 0;
        target.lastHit = now;
      }

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
  p1.draw(ctx, now);
  p2.draw(ctx, now);

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
  p1.keepRange = document.getElementById('keep1').checked;
  p2.keepRange = document.getElementById('keep2').checked;

  running = true;
  lastTimestamp = 0;
  requestAnimationFrame(loop);
}

document.getElementById('start').addEventListener('click', start);
document.getElementById('rematch').addEventListener('click', start);
