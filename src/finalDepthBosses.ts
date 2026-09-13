import type { MonsterDef, MonsterElement, Vec2 } from './types';

export const FINAL_ELEMENTS = ['fire', 'water', 'ice', 'thunder', 'dark'] as const;
export const FINAL_ELEMENT_LABEL: Record<MonsterElement, string> = { fire: '火', water: '水', ice: '氷', thunder: '雷', dark: '闇' };
export const FINAL_DEPTH_BOSSES: Readonly<Record<number, MonsterDef>> = {
  26: { key: 'm_deep_kraken', name: '深海魔クラーケン', description: '貝殻の装甲を持つ水の海魔。太い触手で直線を叩き、時間差で水の波を送り出す。', hp: 90, atkMin: 17, atkMax: 28, def: 17, exp: 160, gold: 34, score: 185, minFloor: 26, maxFloor: 26, behavior: 'chase', element: 'water', color: 0x66c6d5, isDragonType: false },
  27: { key: 'm_valzeon', name: '獄炎騎士ヴァルゼオン', description: '黒鉄の鎧に炎を宿す重装騎士。大剣と二列の炎を避け、振り下ろした後の隙に反撃しよう。', hp: 98, atkMin: 20, atkMax: 33, def: 18, exp: 170, gold: 36, score: 200, minFloor: 27, maxFloor: 27, behavior: 'chase', element: 'fire', color: 0xf5a46e, isDragonType: false },
  28: { key: 'm_selene', name: '氷華女帝セレネ', description: '白銀の髪と氷の冠を持つ女帝。氷槍の列と霜の輪を放つ。輪に残された隙間を見極めよう。', hp: 102, atkMin: 18, atkMax: 31, def: 17, exp: 180, gold: 38, score: 215, minFloor: 28, maxFloor: 28, behavior: 'chase', element: 'ice', color: 0x9cddef, isDragonType: false },
  29: { key: 'm_abyss_lord', name: '虚空魔眼アビスロード', description: '黒曜石と割れた石輪に囲まれた闇の巨大魔眼。視線の直線と、時間差の闇の円を予告する。', hp: 108, atkMin: 21, atkMax: 34, def: 18, exp: 190, gold: 40, score: 235, minFloor: 29, maxFloor: 29, behavior: 'chase', element: 'dark', color: 0xba9adb, isDragonType: false },
  30: { key: 'm_astravein', name: '万象竜皇アストラヴェイン', description: '火・水・氷・雷・闇の五つの核を持つ巨大な竜皇。核の属性表示と床の予告を読み、大技「万象終焉」の後に反撃しよう。', hp: 125, atkMin: 20, atkMax: 34, def: 18, exp: 240, gold: 65, score: 300, minFloor: 30, maxFloor: 30, behavior: 'chase', element: 'fire', elements: FINAL_ELEMENTS, color: 0xdfc68e, isDragonType: true }
};
export function hasFinalDepthTerrain(floor: number) { return Number.isInteger(floor) && floor >= 26 && floor <= 30; }
export function bossBodyRadius(def: Pick<MonsterDef, 'key' | 'isBoss'>) { return def.key === 'm_astravein' && def.isBoss ? 1 : 0; }
export function bodyContains(center: Vec2, radius: number, point: Vec2) {
  return Math.abs(center.x - point.x) <= radius && Math.abs(center.y - point.y) <= radius;
}
export function bodyCells(center: Vec2, radius: number): Vec2[] {
  const cells: Vec2[] = [];
  for (let y = center.y - radius; y <= center.y + radius; y++) for (let x = center.x - radius; x <= center.x + radius; x++) cells.push({ x, y });
  return cells;
}
export function bodyDistance(center: Vec2, radius: number, point: Vec2) {
  return Math.max(0, Math.abs(center.x - point.x) - radius) + Math.max(0, Math.abs(center.y - point.y) - radius);
}
export function finalDepthMobCount(floor: number, bossRoom: boolean, original: number) {
  if (!hasFinalDepthTerrain(floor)) return original;
  return bossRoom ? (floor <= 28 ? 1 : 0) : floor === 30 ? 2 : Math.ceil(original / 2);
}
export interface ElementWave { element: MonsterElement; tiles: Vec2[]; turns: number }
export interface FinalAttackPlan { waves: ElementWave[]; message: string; recovery: number; ultimate?: boolean }
export function finalAttackPlan(floor: number, phase: number, phaseTwo: boolean, boss: Vec2, p: Vec2, valid: (x: number, y: number) => boolean): FinalAttackPlan {
  const clean = (tiles: Vec2[]) => tiles.filter((t, i) => valid(t.x, t.y) && tiles.findIndex(q => q.x === t.x && q.y === t.y) === i);
  const line = (horizontal: boolean, center: Vec2, radius = 3) => clean(Array.from({ length: radius * 2 + 1 }, (_, i) => horizontal ? { x: center.x + i - radius, y: center.y } : { x: center.x, y: center.y + i - radius }));
  const ring = (radius: number, gap = false) => clean(Array.from({ length: (radius * 2 + 1) ** 2 }, (_, i) => ({ x: p.x + i % (radius * 2 + 1) - radius, y: p.y + Math.floor(i / (radius * 2 + 1)) - radius })).filter(t => Math.abs(t.x - p.x) + Math.abs(t.y - p.y) === radius && !(gap && t.x === p.x && t.y > p.y)));
  const horizontal = Math.abs(p.x - boss.x) >= Math.abs(p.y - boss.y);
  const ray = (reach: number, wide = false) => {
    const dx = horizontal ? Math.sign(p.x - boss.x) || 1 : 0, dy = horizontal ? 0 : Math.sign(p.y - boss.y) || 1;
    const tiles: Vec2[] = [];
    for (let side = wide ? -1 : 0; side <= (wide ? 1 : 0); side++) for (let step = Math.abs(side) + 1; step <= reach; step++) {
      const t = { x: boss.x + dx * step + (horizontal ? 0 : side), y: boss.y + dy * step + (horizontal ? side : 0) };
      if (!valid(t.x, t.y)) break;
      tiles.push(t);
    }
    return clean(tiles);
  };
  if (floor === 26) return {
    waves: phase % 2 === 0 ? [{ element: 'water', tiles: ray(5), turns: 1 }] : [
      { element: 'water', tiles: line(true, p), turns: 1 },
      { element: 'water', tiles: line(true, { x: p.x, y: p.y + 1 }), turns: 2 }],
    message: phase % 2 === 0 ? '触手を振り上げた！ 直線の予告から横へ避けろ。' : '水の波が迫る！ 数字の順に一列ずつ波が来る。', recovery: 1
  };
  if (floor === 27) return {
    waves: [{ element: 'fire', tiles: phase % 2 === 0 ? ray(3, true) : clean([...line(horizontal, p), ...line(horizontal, horizontal ? { x: p.x, y: p.y + 2 } : { x: p.x + 2, y: p.y })]), turns: 2 }],
    message: phase % 2 === 0 ? '大剣に炎を集めた！ 振り下ろしの後が反撃の好機。' : '二列の炎が燃え上がる！ 予告の隙間へ逃げろ。', recovery: 2
  };
  if (floor === 28) return {
    waves: phase % 2 === 0 ? [{ element: 'ice', tiles: line(!horizontal, p, 4), turns: 1 }] : [
      { element: 'ice', tiles: ring(3, true), turns: 1 }, { element: 'ice', tiles: ring(2, true), turns: 2 }],
    message: phase % 2 === 0 ? '氷槍を構えた！ 予告された列を離れろ。' : '霜の輪が縮まる！ 南側の隙間も使って逃げろ。', recovery: 1
  };
  if (floor === 29) return {
    waves: phase % 2 === 0 ? [{ element: 'dark', tiles: ray(8), turns: 1 }] : [
      { element: 'dark', tiles: clean([p, ...ring(1)]), turns: 2 }, { element: 'dark', tiles: ring(2, true), turns: 3 }],
    message: phase % 2 === 0 ? '魔眼が開いた！ 視線の直線から離れろ。' : '闇の円が開く！ 数字の順に広がる闇を避けろ。', recovery: 1
  };
  const pattern = (element: MonsterElement) => {
    switch (element) {
      case 'fire': return clean([...line(true, p, 2), ...line(true, { x: p.x, y: p.y - 1 }, 2), ...line(true, { x: p.x, y: p.y + 1 }, 2)]);
      case 'water': return line(true, p, 5);
      case 'ice': return line(false, p, 5);
      case 'thunder': return clean([...line(true, p, 2), ...line(false, p, 2)]);
      case 'dark': return clean([p, ...ring(2, true)]);
    }
  };
  const ultimate = phaseTwo && phase % 5 === 4;
  const elements: MonsterElement[] = ultimate ? [...FINAL_ELEMENTS] : phaseTwo ? [FINAL_ELEMENTS[phase % 5], FINAL_ELEMENTS[(phase + 2) % 5]] : [FINAL_ELEMENTS[phase % 5]];
  // A nearby altar or the arena rim must never turn a readable attack into a trap.
  // Keep one reachable adjacent tile safe throughout the whole elemental sequence.
  const neighbors = (q: Vec2) => [{ x: q.x + 1, y: q.y }, { x: q.x - 1, y: q.y }, { x: q.x, y: q.y + 1 }, { x: q.x, y: q.y - 1 }].filter(t => valid(t.x, t.y));
  const refuge = neighbors(p).sort((a, b) => neighbors(b).length - neighbors(a).length)[0];
  return {
    waves: elements.map((element, i) => ({ element, tiles: pattern(element).filter(t => !refuge || t.x !== refuge.x || t.y !== refuge.y), turns: 2 + i })),
    message: ultimate ? '万象終焉！ 五つの属性が数字の順に襲う。予告の外へ逃げ、技の後に反撃！' : `核が${elements.map(e => FINAL_ELEMENT_LABEL[e]).join('・')}に輝いた！ 属性マークと数字を見て回避しよう。`,
    recovery: ultimate ? 3 : 2, ultimate
  };
}
