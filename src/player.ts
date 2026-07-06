import type { Weapon, Shield, Item, Dir, Magic, MagicCode } from './types';
import { WEAPON_DEFS, SHIELD_DEFS, magicLabel, makeItem } from './data';

export class Player {
  name = 'チャリ';
  level = 1;
  exp = 0;
  expNext = 20;
  hpMax = 100;
  hp = 100;
  baseAtkMin = 5;
  baseAtkMax = 12;
  baseDef = 3;
  gold = 0;

  x = 0;
  y = 0;
  dir: Dir = 'down';

  weapon: Weapon | null = null;
  shield: Shield | null = null;
  inventory: Item[] = [];
  weapons: Weapon[] = [];   // 所持武器
  shields: Shield[] = [];   // 所持盾

  poisonTurns = 0;
  reviveReady = false; // 復活のタネ所持で有効化されるフラグ（アイテム所持で判定）

  constructor() {
    this.weapon = makeWeapon('w_screw', []);
    this.weapons.push(this.weapon);
    this.shield = makeShield('s_gear');
    this.shields.push(this.shield);
    // 初期アイテム
    this.inventory.push(makeItem('potion'));
    this.inventory.push(makeItem('potion'));
    this.inventory.push(makeItem('potion'));
  }

  get atkMin(): number {
    let v = this.baseAtkMin + Math.floor(this.level * 0.6);
    if (this.weapon) {
      v += this.weapon.atkMin;
      v += (this.weapon.plus ?? 0) * 2; // 強化+1ごとに最小+2
      for (const m of this.weapon.magics) {
        if (m.code === 'A') v += m.level;
      }
    }
    return v;
  }

  get atkMax(): number {
    let v = this.baseAtkMax + this.level;
    if (this.weapon) {
      v += this.weapon.atkMax;
      v += (this.weapon.plus ?? 0) * 4; // 強化+1ごとに最大+4
      for (const m of this.weapon.magics) {
        if (m.code === 'A') v += m.level;
        if (m.code === 'B') v += m.level;
      }
    }
    return v;
  }

  get def(): number {
    let v = this.baseDef + Math.floor(this.level * 0.4);
    if (this.shield && this.shield.dur > 0) v += this.shield.defBonus + (this.shield.plus ?? 0);
    return v;
  }

  hasMagic(code: MagicCode): Magic | undefined {
    return this.weapon?.magics.find((m) => m.code === code);
  }

  addExp(v: number): boolean {
    this.exp += v;
    let leveled = false;
    while (this.exp >= this.expNext) {
      this.exp -= this.expNext;
      this.level++;
      this.hpMax += 12;
      this.hp = this.hpMax;
      this.expNext = Math.floor(this.expNext * 1.35 + 8);
      leveled = true;
    }
    return leveled;
  }

  heal(v: number) {
    this.hp = Math.min(this.hpMax, this.hp + v);
  }
}

export function makeWeapon(key: string, magics: Magic[]): Weapon {
  const def = WEAPON_DEFS.find((d) => d.key === key)!;
  let durMax = def.durMax;
  let atkMin = def.atkMin;
  let atkMax = def.atkMax;
  for (const m of magics) {
    if (m.code === 'H') durMax += m.level * 15;
  }
  return {
    key: def.key, name: def.name, atkMin, atkMax,
    durMax, dur: durMax, magics, plus: 0, dual: def.dual
  };
}

export function makeShield(key: string): Shield {
  const def = SHIELD_DEFS.find((d) => d.key === key)!;
  return { key: def.key, name: def.name, defBonus: def.defBonus, durMax: def.durMax, dur: def.durMax, plus: 0 };
}

export function shieldFullName(s: Shield): string {
  return `${(s.plus ?? 0) > 0 ? `+${s.plus} ` : ''}${s.name}`;
}

// ランダムなマジックをn個生成（ガチャ・武器生成で共用）
export function rollMagics(n: number): Magic[] {
  const magics: Magic[] = [];
  const codes: MagicCode[] = ['B', 'A', 'H', 'R', 'F', 'D', 'DK', 'C', 'P', 'I', 'K'];
  for (let i = 0; i < n; i++) {
    const code = codes[Math.floor(Math.random() * codes.length)];
    if (magics.some((m) => m.code === code)) continue;
    let level = 1;
    if (code === 'B') level = 2 + Math.floor(Math.random() * 5); // 2-6
    else if (code === 'A' || code === 'H') level = 1 + Math.floor(Math.random() * 3); // 1-3
    magics.push({ code, level, label: magicLabel(code, level) });
  }
  return magics;
}

// マジック付き武器をランダム生成
export function rollWeapon(floor: number): Weapon {
  const pool = WEAPON_DEFS.filter((d) => d.minFloor <= floor);
  // rarity重み
  const totalW = pool.reduce((s, d) => s + d.rarity, 0);
  let r = Math.random() * totalW;
  let picked = pool[0];
  for (const d of pool) { r -= d.rarity; if (r <= 0) { picked = d; break; } }

  const magicChance = 0.35 + Math.min(0.4, floor * 0.015);
  const magics: Magic[] = Math.random() < magicChance
    ? rollMagics(Math.random() < 0.25 ? 2 : 1)
    : [];
  const weapon = makeWeapon(picked.key, magics);
  // 一定確率で最初から強化済み（+1が多く、たまに+2/+3。深い階ほど出やすい）
  if (Math.random() < 0.22 + Math.min(0.18, floor * 0.01)) {
    const r = Math.random();
    weapon.plus = r < 0.65 ? 1 : r < 0.9 ? 2 : 3;
  }
  return weapon;
}

export function weaponFullName(w: Weapon): string {
  const plus = (w.plus ?? 0) > 0 ? `+${w.plus} ` : '';
  const magic = w.magics.length ? ` [${w.magics.map((m) => m.label).join('')}]` : '';
  const dual = w.dual ? '〔二刀〕' : '';
  return `${plus}${w.name}${dual}${magic}`;
}
