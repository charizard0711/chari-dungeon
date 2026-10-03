/** The journal persists across adventures; rewards belong to the adventure that claims them. */
export const QUEST_FRAGMENT_RATE = .005;
export const QUEST_FRAGMENTS_REQUIRED = 5;
export const SECRET_QUESTS = [
  { id: 'lantern', monster: 'm_mush', targetName: 'ランタンマッシュ', title: '消えない森の灯', count: 20 },
  { id: 'owl', monster: 'm_skel', targetName: '蒼灯フクロウ', title: '蒼い夜の番人', count: 20 },
  { id: 'clockwork', monster: 'm_spider', targetName: 'カラクリ蜘蛛', title: '断ち切れ、鋼の糸', count: 20 },
  { id: 'iron', monster: 'm_golem', targetName: '鉄塊ゴーレム', title: '砕けぬ者への挑戦', count: 20 },
  { id: 'eye', monster: 'm_eye', targetName: '監視の眼', title: '深淵の視線を消せ', count: 20 }
] as const;
export const SECRET_WEAPON_KEYS = ['w_secret_ember', 'w_secret_tide', 'w_secret_storm', 'w_secret_frost', 'w_secret_solar'] as const;
export interface SecretQuestProgress { fragments: number; kills: Record<string, number>; claimed: string[]; announced: string[] }
const count = (n: unknown, max: number) => typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(max, Math.floor(n))) : 0;
export function normalizeQuests(value?: Partial<SecretQuestProgress> | null): SecretQuestProgress {
  const ids = new Set<string>(SECRET_QUESTS.map(q => q.id));
  const list = (v: unknown) => Array.isArray(v) ? [...new Set(v.filter(id => typeof id === 'string' && ids.has(id)))] : [];
  const fragments = count(value?.fragments, QUEST_FRAGMENTS_REQUIRED);
  const revealed = fragments >= QUEST_FRAGMENTS_REQUIRED;
  // Discard pre-unlock credit from old saves; retain already revealed progress and claimed rewards.
  return { fragments,
    kills: Object.fromEntries(SECRET_QUESTS.map(q => [q.id, revealed ? count(value?.kills?.[q.id], q.count) : 0])),
    claimed: list(value?.claimed), announced: revealed ? list(value?.announced) : [] };
}
export function mergeQuests(a?: Partial<SecretQuestProgress>, b?: Partial<SecretQuestProgress>): SecretQuestProgress {
  const x = normalizeQuests(a), y = normalizeQuests(b);
  return normalizeQuests({ fragments: Math.max(x.fragments, y.fragments),
    kills: Object.fromEntries(SECRET_QUESTS.map(q => [q.id, Math.max(x.kills[q.id], y.kills[q.id])])),
    claimed: [...x.claimed, ...y.claimed], announced: [...x.announced, ...y.announced] });
}
export const questsRevealed = (p: SecretQuestProgress) => p.fragments >= QUEST_FRAGMENTS_REQUIRED;
export const completedQuestCount = (p: SecretQuestProgress) => SECRET_QUESTS.filter(q => p.kills[q.id] >= q.count).length;
export function canClaimQuest(p: SecretQuestProgress) {
  // Any individual reward claimed in an older save also consumes the single journal reward.
  return questsRevealed(p) && completedQuestCount(p) === SECRET_QUESTS.length && p.claimed.length === 0;
}
/** Call once per defeated enemy. Clues drop independently and collect into the journal. */
export function recordQuestKill(p: SecretQuestProgress, monster: string, random = Math.random) {
  const wasRevealed = questsRevealed(p);
  const wasRewardReady = canClaimQuest(p);
  // The enemy dropping the fifth fragment was defeated before the quest started.
  if (wasRevealed) {
    for (const q of SECRET_QUESTS) if (q.monster === monster) p.kills[q.id] = Math.min(q.count, (p.kills[q.id] || 0) + 1);
  }
  const fragment = !wasRevealed && random() < QUEST_FRAGMENT_RATE;
  if (fragment) p.fragments = Math.min(QUEST_FRAGMENTS_REQUIRED, p.fragments + 1);
  const revealed = !wasRevealed && questsRevealed(p);
  const completed = SECRET_QUESTS.filter(q => questsRevealed(p) && p.kills[q.id] >= q.count && !p.announced.includes(q.id));
  p.announced.push(...completed.map(q => q.id));
  return { fragment, revealed, completed, rewardReady: !wasRewardReady && canClaimQuest(p) };
}
export function claimQuest(p: SecretQuestProgress, weaponKey: string) {
  if (!canClaimQuest(p) || !(SECRET_WEAPON_KEYS as readonly string[]).includes(weaponKey)) return false;
  // Preserve the v1 save format and prevent older clients from offering individual rewards.
  p.claimed = SECRET_QUESTS.map(q => q.id); return true;
}
export const QUEST_SAVE_KEY = 'chari-secret-quests-v1';
export function readQuestJournal(): SecretQuestProgress {
  try { return normalizeQuests(JSON.parse(localStorage.getItem(QUEST_SAVE_KEY) || 'null')); }
  catch { return normalizeQuests(); }
}
export function writeQuestJournal(p: SecretQuestProgress) {
  try { localStorage.setItem(QUEST_SAVE_KEY, JSON.stringify(normalizeQuests(p))); return true; }
  catch { return false; }
}
