import { shieldEnhancementHeal } from './enhancement';
import type { MonsterElement, Shield } from './types';

export interface ShieldDefenseContext { hp: number; hpMax: number; attackerElement?: MonsterElement }

/** Only direct enemy hits trigger shield passives. Counters persist on the individual shield. */
export function resolveShieldHit(shield: Shield | null, damage: number, context: ShieldDefenseContext, random = Math.random) {
  let adjusted = damage, heal = 0, reflect = 0;
  let message: string | undefined;
  if (!shield || damage <= 0) return { damage, heal, reflect, message };
  const key = shield.passive?.key;
  const reduce = (rate: number) => { adjusted = Math.max(1, Math.floor(damage * (1 - rate))); };
  const blockEvery = (interval: number) => {
    if (count % interval === 0) { adjusted = 0; message = `${shield.name}の${shield.passive!.name}！ 攻撃を完全に無効化！`; }
  };
  const count = shield.guardCounter = (shield.guardCounter ?? 0) + 1;
  switch (key) {
    case 'brace': if (damage >= 10) reduce(.2); break;
    case 'mirror': if (random() < .15) { adjusted = 0; message = `${shield.name}が攻撃を映し、完全に無効化！`; } break;
    case 'emerald_guard': reflect = Math.floor(damage * .2); break;
    case 'thorns': reflect = Math.max(1, Math.floor(damage * .25)); break;
    case 'perfect_guard': blockEvery(5); break;
    case 'recovery': if (count % 4 === 0) heal = 6; break;
    case 'oak_guard': if (damage <= 8) adjusted = Math.max(1, damage - 2); break;
    case 'scout_guard': if (count % 4 === 0) reduce(.5); break;
    case 'flat_guard': adjusted = Math.max(1, damage - 2); break;
    case 'pilgrim_heal': if (count % 4 === 0) heal = 3; break;
    case 'duelist_parry': if (count % 3 === 0) reduce(.5); break;
    case 'neutral_guard': if (!context.attackerElement) reduce(.2); break;
    case 'sun_guard': if (context.hp >= context.hpMax * .7) reduce(.25); break;
    case 'moon_guard': if (context.hp <= context.hpMax * .4) reduce(.35); break;
    case 'requiem_guard': reduce(.15); reflect = Math.max(1, Math.floor(adjusted * .1)); break;
    case 'prism_guard': if (context.attackerElement) reduce(.25); break;
    case 'ember_retort': reflect = Math.max(1, Math.floor(damage * .15)); break;
    case 'pearl_mend': if (count % 3 === 0) heal = 4; break;
    case 'thunder_parry': blockEvery(4); break;
    case 'glacier_guard': if (damage >= 12) reduce(.2); break;
    case 'arcadia_guard':
      blockEvery(3);
      if (adjusted > 0) reflect = Math.floor(adjusted * .2);
      break;
  }
  if (count % 3 === 0) heal += shieldEnhancementHeal(shield.plus);
  if (adjusted > 0 && adjusted < damage) message = `${shield.name}の${shield.passive?.name ?? '守り'}でダメージを軽減！`;
  return { damage: adjusted, heal, reflect, message };
}
