import Phaser from 'phaser';
import type { UIScene } from './scenes/UIScene';
import { SECRET_QUESTS, SECRET_WEAPON_KEYS, questsRevealed, canClaimQuest, completedQuestCount } from './secretQuests';
import { WEAPON_DEFS, ELEMENT_INFO } from './data';
import { Audio } from './audio/manager';

export function buildQuestJournal(ui: UIScene, x: number, y: number, w: number, h: number) {
  const p = ui.gs.secretQuests, revealed = questsRevealed(p), mobile = w < 500;
  const text = (tx: number, ty: number, value: string, size = 14, color = '#e8dfd1', width = w - 44) => {
    const label = ui.add.text(tx, ty, value, { fontFamily: '"Yu Gothic UI", sans-serif', fontSize: `${size}px`, color, wordWrap: {width}, lineSpacing: 4 });
    ui.overlay.add(label); return label;
  };
  const button = (bx: number, by: number, bw: number, label: string, action: () => void) => {
    const rect = ui.add.rectangle(bx, by, bw, 34, 0x433550).setOrigin(0).setStrokeStyle(1, 0xd5b978).setInteractive({useHandCursor:true});
    rect.on('pointerover', () => rect.setFillStyle(0x625072)); rect.on('pointerout', () => rect.setFillStyle(0x433550));
    rect.on('pointerdown', () => { Audio.playSe('click'); action(); });
    ui.overlay.add(rect); text(bx + bw / 2, by + 17, label, 12, '#ffdf98', bw).setOrigin(.5);
  };
  if (ui.secretRewardOpen && !canClaimQuest(p)) ui.secretRewardOpen = false;
  if (ui.secretRewardOpen) {
    text(x + 20, y + 55, '5つの秘宝から、1つを選んでください。', mobile ? 14 : 18, '#f5d99e');
    text(x + 20, y + 87, 'すべて Sランク・＋3 ／ 5つ全達成の報酬は1回限り', 11, '#b5a5be');
    const step = mobile ? 108 : 96;
    SECRET_WEAPON_KEYS.forEach((key, i) => {
      const d = WEAPON_DEFS.find(d => d.key === key)!, yy = y + 119 + i * step;
      const bg = ui.add.rectangle(x + 15, yy, w - 30, step - 8, 0x19232e).setOrigin(0).setStrokeStyle(1, 0x4c445a);
      const image = ui.add.image(x + 57, yy + 42, key).setDisplaySize(69, 69);
      ui.overlay.add([bg, image]);
      text(x + 101, yy + 10, d.name, mobile ? 13 : 16, '#f2dfb7', w - 120);
      text(x + 101, yy + 34, `${ELEMENT_INFO[d.element!].name}属性  ／  攻撃 ${d.atkMin + 3}〜${d.atkMax + 3}`, 11, '#92cbd5', w - 126);
      text(x + 101, yy + 56, d.passive!.description, mobile ? 10 : 12, '#b8b4ca', w - (mobile ? 120 : 226));
      button(x + w - 105, yy + step - 43, 86, 'この武器を選ぶ', () => {
        if (ui.gs.claimSecretQuest(key)) { ui.secretRewardOpen = false; ui.setOverlay(ui.gs.pendingEquipment ? 'equip' : 'quests'); }
      });
    });
    button(x + 18, y + h - 47, 95, '手帳に戻る', () => { ui.secretRewardOpen = false; ui.rebuildOverlay(); });
    return;
  }
  ui.overlay.add(ui.add.image(x + 47, y + 91, 'ui_nav_quests').setDisplaySize(62, 62));
  text(x + 89, y + 55, revealed ? '失われた依頼書、解読完了' : 'まだ、誰も知らない依頼', mobile ? 15 : 20, '#f0dba8', w - 115);
  text(x + 89, y + 85, revealed ? '各20体・5つすべて達成で、秘宝を1本。' : '紙の切れ端を5枚集めると、内容が明かされる。', 11, '#b3a7c4', w - 110);
  for (let i = 0; i < 5; i++) {
    ui.overlay.add(ui.add.image(x + 102 + i * 31, y + 128, 'quest_fragment').setDisplaySize(25, 25).setAlpha(i < p.fragments ? 1 : .14));
  }
  text(x + 265, y + 120, `${p.fragments} / 5`, 13, '#dcc993', 64);
  const step = mobile ? 94 : 82;
  SECRET_QUESTS.forEach((q, i) => {
    const yy = y + 160 + i * step, complete = revealed && p.kills[q.id] >= q.count;
    ui.overlay.add(ui.add.rectangle(x + 16, yy, w - 32, step - 9, complete ? 0x30263d : 0x17212a).setOrigin(0).setStrokeStyle(1, complete ? 0xd6b571 : 0x3e4551));
    if (revealed) ui.overlay.add(ui.add.image(x + 48, yy + 37, q.monster).setDisplaySize(47, 47));
    else text(x + 48, yy + 18, '？', 34, '#8e799d', 50).setOrigin(.5, 0);
    text(x + 83, yy + 12, revealed ? q.title : '？？？？？？', mobile ? 14 : 17, complete ? '#f4d899' : '#d0c6d8', w - 108);
    text(x + 83, yy + 38, revealed ? `${q.targetName}  ${p.kills[q.id]} / ${q.count}` : '封印された秘密クエスト', mobile ? 11 : 13, '#a0a9bb', w - 105);
    if (revealed) {
      const bw = mobile ? 148 : w - 245, ratio = p.kills[q.id] / q.count;
      ui.overlay.add(ui.add.rectangle(x + 83, yy + 65, bw, 3, 0x354150).setOrigin(0));
      if (ratio > 0) ui.overlay.add(ui.add.rectangle(x + 83, yy + 65, bw * ratio, 3, complete ? 0xe1bd73 : 0x8199ba).setOrigin(0));
      if (complete) text(x + w - 70, yy + 56, '達成', 11, '#e1bd73', 50);
    }
  });
  if (revealed) {
    text(x + 20, y + h - 98, `達成 ${completedQuestCount(p)} / 5`, 16, '#f5d99e', w - 185);
    if (canClaimQuest(p)) button(x + w - 164, y + h - 104, 144, '全達成の報酬を選ぶ', () => { ui.secretRewardOpen = true; ui.rebuildOverlay(); });
    else text(x + w - 164, y + h - 94, p.claimed.length ? '報酬は受取済み' : '5つすべて達成で報酬', 11, '#b3a7c4', 148);
  }
  text(x + 20, y + h - 40, revealed ? '討伐数・解読状況は冒険を越えて引き継がれます。' : '魔物撃破時に5%で切れ端が出現。自動で手帳へ収めます。', 10, '#9491a3');
  text(x + 20, y + h - 23, '解読前の討伐も記録。報酬の武器は受け取った冒険で使用します。', 10, '#9491a3');
}

export interface QuestNotice { title: string; detail: string }
/** Queued, non-blocking celebration. Never interrupts a combat action or captures input. */
export class QuestCelebrations {
  private queue: QuestNotice[] = [];
  private playing = false;
  constructor(private scene: Phaser.Scene, private x: number, private y: number, private width: number) {}
  push = (notice: QuestNotice) => { this.queue.push(notice); this.next(); };
  private next() {
    if (this.playing || !this.queue.length) return;
    this.playing = true;
    const note = this.queue.shift()!, scene = this.scene, w = Math.min(this.width - 18, 470);
    const group = scene.add.container(this.x, this.y - 12).setDepth(500).setAlpha(0);
    const panel = scene.add.rectangle(0, 0, w, 110, 0x140f23, .94).setStrokeStyle(1, 0xd6bb81);
    const crest = scene.add.image(-w / 2 + 49, 0, 'quest_crest').setDisplaySize(80, 80);
    const title = scene.add.text(-w / 2 + 94, -32, note.title, {fontFamily:'"Yu Mincho", serif',fontSize:w<400?'19px':'24px',color:'#ffe2a2',wordWrap:{width:w-108}});
    const detail = scene.add.text(-w / 2 + 94, 6, note.detail, {fontFamily:'"Yu Gothic UI"',fontSize:'11px',color:'#cec4e3',wordWrap:{width:w-108},lineSpacing:4});
    group.add([panel, crest, title, detail]);
    Audio.playSe('levelup');
    scene.tweens.add({targets:group,alpha:1,y:this.y,duration:350,ease:'Cubic.out'});
    scene.tweens.add({targets:crest,angle:5,duration:900,yoyo:true,repeat:1});
    scene.tweens.add({targets:group,alpha:0,y:this.y-15,duration:450,delay:3400,onComplete:()=>{group.destroy(true);this.playing=false;this.next();}});
  }
}
