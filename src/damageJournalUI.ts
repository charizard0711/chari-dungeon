import Phaser from 'phaser';
import { GAME_W, GAME_H, IS_MOBILE } from './layout';
import { DIFFICULTY_RULES, type Difficulty } from './difficulty';
import { Audio } from './audio/manager';
import type { AdventureEntry, DamageEntry } from './damageJournal';

const FONT = '"Yu Gothic UI", Meiryo, sans-serif';

/** Shared by the live game menu and the defeat screen. */
export function createDamageJournal(scene: Phaser.Scene, damage: DamageEntry[], adventure: AdventureEntry[],
  difficulty: Difficulty, onClose: () => void, fatalFirst = false) {
  const root = scene.add.container(0, 0).setDepth(220).setName('damage-journal');
  const mobile = IS_MOBILE, theme = DIFFICULTY_RULES[difficulty];
  const w = mobile ? GAME_W - 16 : 920, h = mobile ? GAME_H - 60 : 680;
  const x = (GAME_W - w) / 2, y = (GAME_H - h) / 2;
  let tab: 'damage' | 'adventure' = 'damage', page = 0;
  let selected: DamageEntry | undefined;
  let selectedAdventure: AdventureEntry | undefined;
  let pageCount = 1;
  const fatal = [...damage].reverse().find(entry => entry.lethal && !entry.revived);
  if (fatalFirst) selected = fatal;
  const text = (tx: number, ty: number, value: string, size = 14, color = '#e6dfd1', width = w - 48) => {
    const label = scene.add.text(tx, ty, value, { fontFamily: FONT, fontSize: `${size}px`, color,
      wordWrap: { width, useAdvancedWrap: true }, lineSpacing: 4 });
    root.add(label); return label;
  };
  const button = (bx: number, by: number, bw: number, label: string, action: () => void, active = false, enabled = true) => {
    const plate = scene.add.rectangle(bx, by, bw, 38, active ? 0x293841 : 0x111820).setOrigin(0)
      .setStrokeStyle(active ? 2 : 1, enabled ? theme.color : 0x41434a);
    root.add(plate);
    text(bx + bw / 2, by + 19, label, mobile ? 13 : 15, enabled ? theme.text : '#707781', bw - 8).setOrigin(.5);
    if (enabled) plate.setInteractive({ useHandCursor: true }).on('pointerdown', () => { Audio.playSe('click'); action(); });
    return plate;
  };
  const close = () => { root.destroy(true); onClose(); };
  const render = () => {
    root.removeAll(true);
    root.add(scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x020307, .8).setInteractive());
    root.add(scene.add.image(x + w / 2, y + h / 2, 'ui_damage_journal_panel').setDisplaySize(w, h)
      .setTint(difficulty === 'hard' ? 0xb0dcff : difficulty === 'master' ? 0xffe29b : 0xe9d2a8));
    root.add(scene.add.image(x + 42, y + 36, 'ui_nav_damage_log').setDisplaySize(40, 40));
    text(x + 70, y + 21, '詳細ログ', mobile ? 21 : 26, theme.text, w - 142);
    const closeArt = scene.add.image(x + w - 38, y + 36, 'ui_close_button').setDisplaySize(38, 38).setName('journal-close');
    closeArt.setInteractive({useHandCursor:true}).on('pointerdown', () => { Audio.playSe('click'); close(); });
    root.add(closeArt);
    const tabW = (w - 54) / 2;
    button(x + 24, y + 72, tabW, '被ダメージ', () => { tab = 'damage'; page = 0; selected = undefined; selectedAdventure = undefined; render(); }, tab === 'damage').setName('journal-tab-damage');
    button(x + 30 + tabW, y + 72, tabW, '冒険ログ', () => { tab = 'adventure'; page = 0; selected = undefined; selectedAdventure = undefined; render(); }, tab === 'adventure').setName('journal-tab-adventure');
    if (selectedAdventure && tab === 'adventure') {
      button(x + 24, y + 126, 140, '‹ 履歴に戻る', () => { selectedAdventure = undefined; render(); });
      text(x + 24, y + 187, `${selectedAdventure.floor}階 · ${selectedAdventure.turn}ターン`, mobile ? 15 : 20, theme.text);
      text(x + 24, y + 235, selectedAdventure.msg, mobile ? 16 : 21, '#e6dfd1');
      pageCount = 1;
      return;
    }
    if (selected && tab === 'damage') {
      button(x + 24, y + 126, 140, '‹ 履歴に戻る', () => { selected = undefined; render(); }).setName('journal-back');
      const entry = selected;
      text(x + 24, y + 184, entry.lethal ? entry.revived ? '致命傷 → 復活' : 'この一撃で力尽きた' : 'ダメージの内訳', mobile ? 21 : 26, entry.lethal ? '#ffaaa3' : theme.text);
      text(x + 24, y + 223, `${entry.floor}階 · ${entry.turn}ターン ／ ${entry.source}`, mobile ? 13 : 16, '#aebfc9');
      const reason = text(x + 24, y + 252, entry.reason, mobile ? 14 : 18, '#efe5d0');
      const summaryY = y + 258 + reason.height;
      text(x + 24, summaryY, `HP ${entry.hpBefore} → ${entry.damage}ダメージ → HP ${entry.hpAfter}`, mobile ? 17 : 23, '#ffb5a5');
      const rowsY = summaryY + (mobile ? 54 : 62);
      const available = y + h - 56 - rowsY;
      const rows = entry.steps;
      // Paginate long formulas instead of clipping text on phones.
      const maxRows = mobile ? 4 : 6;
      const pages = Math.max(1, Math.ceil(rows.length / maxRows));
      page = Math.min(page, pages - 1);
      const rowH = Math.min(mobile ? 88 : 48, available / maxRows);
      rows.slice(page * maxRows, (page + 1) * maxRows).forEach((line, index) => {
        const yy = rowsY + index * rowH;
        root.add(scene.add.rectangle(x + 24, yy, w - 48, rowH - 5, 0x111a23, .92).setOrigin(0).setStrokeStyle(1, 0x3b454c));
        text(x + 34, yy + 8, `${page * maxRows + index + 1}. ${line}`, mobile ? 12 : 15, '#ddd8cb', w - 68);
      });
      pagination(pages);
      return;
    }
    const entries = tab === 'damage' ? [...damage].reverse() : [...adventure].reverse();
    const perPage = 5, pages = Math.max(1, Math.ceil(entries.length / perPage));
    page = Math.min(page, pages - 1);
    text(x + 24, y + 127, tab === 'damage' ? `新しい順 · ${damage.length}件 ／ 押すと計算の内訳` : `新しい順 · ${adventure.length}件 ／ 直近120件を記録`, mobile ? 11 : 14, '#afbac4');
    if (!entries.length) text(x + 24, y + 208, tab === 'damage' ? 'まだ被ダメージの記録はありません。\n攻撃や地形・毒のダメージがここに残ります。' : 'まだ冒険の記録はありません。', mobile ? 15 : 19, '#c2c2bb');
    const startY = y + 165, rowH = (h - 239) / perPage;
    entries.slice(page * perPage, (page + 1) * perPage).forEach((item, index) => {
      const yy = startY + index * rowH;
      const hit = tab === 'damage' ? item as DamageEntry : undefined;
      root.add(scene.add.rectangle(x + 24, yy, w - 48, rowH - 8, hit?.lethal ? 0x302022 : 0x111a23, .96).setOrigin(0)
        .setStrokeStyle(1, hit?.lethal ? 0xaa6860 : 0x394854));
      text(x + 36, yy + 9, `${item.floor}階 · ${item.turn}ターン${hit?.lethal ? hit.revived ? ' ／ 復活' : ' ／ 致命傷' : ''}`, mobile ? 11 : 13, '#b1c0c5', w - 74);
      if (hit) {
        text(x + 36, yy + 30, hit.reason, mobile ? 12 : 16, '#eee1cc', w - 74).setMaxLines(mobile ? 2 : 1);
        text(x + 36, yy + rowH - 34, `${hit.damage}ダメージ ／ HP ${hit.hpBefore} → ${hit.hpAfter}    ›`, mobile ? 13 : 17, '#ffb1a6', w - 74);
        root.add(scene.add.zone(x + 24, yy, w - 48, rowH - 8).setOrigin(0).setName(`damage-entry-${page * perPage + index}`)
          .setInteractive({ useHandCursor: true }).on('pointerdown', () => { selected = hit; page = 0; render(); }));
      } else {
        text(x + 36, yy + 30, (item as AdventureEntry).msg, mobile ? 12 : 16, '#e4dfd5', w - 74).setMaxLines(mobile ? 3 : 2);
        root.add(scene.add.zone(x + 24, yy, w - 48, rowH - 8).setOrigin(0).setName(`adventure-entry-${page * perPage + index}`)
          .setInteractive({ useHandCursor: true }).on('pointerdown', () => { selectedAdventure = item as AdventureEntry; render(); }));
      }
    });
    pagination(pages);
  };
  const pagination = (pages: number) => {
    pageCount = pages;
    const yy = y + h - 53;
    button(x + 24, yy, mobile ? 85 : 120, '‹ 前へ', () => { page--; render(); }, false, page > 0).setName('journal-prev');
    text(x + w / 2, yy + 19, `${page + 1} / ${pages}`, 14, theme.text, 88).setOrigin(.5);
    button(x + w - (mobile ? 109 : 144), yy, mobile ? 85 : 120, '次へ ›', () => { page++; render(); }, false, page < pages - 1).setName('journal-next');
  };
  const key = (event: KeyboardEvent) => {
    if (!root.active) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (['ArrowLeft', 'PageUp', 'ArrowRight', 'PageDown'].includes(event.key) && !event.repeat) {
      event.preventDefault();
      page = Phaser.Math.Clamp(page + (['ArrowLeft', 'PageUp'].includes(event.key) ? -1 : 1), 0, pageCount - 1);
      render();
    }
  };
  scene.input.keyboard?.on('keydown', key);
  root.once(Phaser.GameObjects.Events.DESTROY, () => scene.input.keyboard?.off('keydown', key));
  render();
  return root;
}
