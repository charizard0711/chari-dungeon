import Phaser from 'phaser';
import { ENGLISH_TEMPLATES } from './localeTemplates';
import { ENGLISH } from './localeEnglish';

export type Language = 'ja' | 'en';
const STORAGE_KEY = 'chari-dungeon.language.v1';
let language: Language = 'ja';
try { if (localStorage.getItem(STORAGE_KEY) === 'en') language = 'en'; } catch { /* Private browsing. */ }
const cache = new Map<string, string>();
const originals = new Map<Phaser.GameObjects.Text, string | string[]>();
const entries = Object.entries(ENGLISH).filter(([key]) => key.length > 1).sort((a, b) => b[0].length - a[0].length);
const escaped = entries.map(([key]) => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const matcher = new RegExp(escaped.join('|'), 'g');
const patterns = ENGLISH_TEMPLATES.map(([source, target]) => ({
  expression: new RegExp('^' + source.split(/\{\d+\}/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(.*?)') + '$'), target
}));
export const getLanguage = () => language;
export function translate(source: string): string {
  if (language === 'ja') return source;
  if (cache.has(source)) return cache.get(source)!;
  if (ENGLISH[source]) return ENGLISH[source];
  for (const { expression, target } of patterns) {
    const match = source.match(expression);
    if (match) return target.replace(/\{(\d+)\}/g, (_token, index) => translate(match[Number(index) + 1]));
  }
  const result = source.replace(matcher, match => ENGLISH[match])
    .replace(/攻(?=[\s+\-]?\d)/g, 'ATK ').replace(/防(?=[\s+\-]?\d)/g, 'DEF ')
    .replace(/服(?=[\s▶])/g, 'Outfit').replace(/（低）|\(低\)/g, '(Low)').replace(/（中）|\(中\)/g, '(Medium)').replace(/（高）|\(高\)/g, '(High)')
    .replace(/盾/g, 'Shield').replace(/([東西南北])(?=[:：])/g, direction => ({'東':'East','西':'West','南':'South','北':'North'}[direction]!))
    .replace(/(\d+(?:\.\d+)?)階/g, 'Floor $1')
    .replace(/(\d+)ターン/g, '$1 turns').replace(/(\d+)歩/g, '$1 steps')
    .replace(/(\d+)個/g, '$1').replace(/(\d+)体/g, '$1');
  if (cache.size > 4096) cache.clear();
  cache.set(source, result);
  return result;
}
export function setLanguage(value: Language): void {
  if (value !== 'ja' && value !== 'en') return;
  language = value;
  cache.clear();
  try { localStorage.setItem(STORAGE_KEY, value); } catch { /* Switching still works without storage. */ }
  document.documentElement.lang = value;
  refreshLoadingLabels();
  for (const [text, source] of originals) text.setText(source);
  window.dispatchEvent(new Event('chari-language-changed'));
}
/** Translate at the presentation boundary; save data, item IDs and game logic stay Japanese. */
function refreshLoadingLabels(): void {
  const tip = document.querySelector<HTMLElement>('.loading-tip');
  if (tip) tip.textContent = translate('お金がたまったら、ガチャで装備を整えよう。');
  document.getElementById('loading-screen')?.setAttribute('aria-label', translate('ゲームを読み込み中'));
}
export function installLocalization(): void {
  const originalSetText = Phaser.GameObjects.Text.prototype.setText;
  Phaser.GameObjects.Text.prototype.setText = function(value: string | string[]): Phaser.GameObjects.Text {
    if (!originals.has(this)) this.once('destroy', () => originals.delete(this));
    originals.set(this, Array.isArray(value) ? [...value] : value);
    originalSetText.call(this, Array.isArray(value) ? value.map(translate) : translate(String(value ?? '')));
    const maxWidth = this.getData('localeMaxWidth') as number | undefined;
    if (maxWidth && this.width > maxWidth) {
      const full = this.text;
      let lo = 0, hi = full.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (this.context.measureText(full.slice(0, mid) + '…').width <= maxWidth) lo = mid;
        else hi = mid - 1;
      }
      originalSetText.call(this, full.slice(0, lo) + '…');
    }
    return this;
  };
  document.documentElement.lang = language;
  refreshLoadingLabels();
}
export function addLanguageControl(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Text {
  const button = scene.add.text(x, y, '日本語 / English', {
    fontFamily: '"Yu Gothic UI", sans-serif', fontSize: '14px', color: '#ffe5a2',
    backgroundColor: '#10252c', padding: { x: 12, y: 9 }
  }).setOrigin(.5).setDepth(80).setName('language-switch').setInteractive({ useHandCursor: true });
  button.on('pointerdown', () => setLanguage(language === 'ja' ? 'en' : 'ja'));
  const update = () => { button.setText(language === 'ja' ? '日本語 → English' : 'English → 日本語'); };
  update(); window.addEventListener('chari-language-changed', update);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('chari-language-changed', update));
  return button;
}
