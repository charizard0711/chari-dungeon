import Phaser from 'phaser';
import type { GachaResult } from './scenes/GameScene';
import { equipmentIconTexture, equipmentIconFlipX } from './artRefresh';
import { Audio } from './audio/manager';

export function playRitual(scene: Phaser.Scene, rect: { x: number; y: number; w: number; h: number }, result: GachaResult, onClose: () => void) {
  const { x, y, w, h } = rect, cx = w / 2;
  const mobile = w < 450, chestY = h * .53, chestSize = Math.min(w * .58, 230);
  const color = '#' + result.color.toString(16).padStart(6, '0');
  const rare = ['S', 'SS', 'SSS'].includes(result.grade);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const layer = scene.add.container(x, y).setDepth(320).setName('gacha-ritual');
  const timers: Phaser.Time.TimerEvent[] = [];
  const shape = scene.make.graphics({}, false).fillStyle(0xffffff).fillRoundedRect(x, y, w, h, 12);
  const mask = shape.createGeometryMask(); layer.setMask(mask);
  const add = <T extends Phaser.GameObjects.GameObject>(obj: T) => { layer.add(obj); return obj; };
  const tween = (config: Phaser.Types.Tweens.TweenBuilderConfig) => scene.tweens.add(config);
  const later = (ms: number, fn: () => void) => timers.push(scene.time.delayedCall(reduced ? ms * .4 : ms, fn));
  let closed = false;
  const dispose = () => {
    if (closed) return; closed = true;
    timers.forEach(timer => timer.remove());
    for (const obj of layer.list) scene.tweens.killTweensOf(obj);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, dispose);
    layer.destroy(true); mask.destroy(); shape.destroy();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, dispose);
  add(scene.add.rectangle(cx, h / 2, w, h, 0x051310));
  const bg = add(scene.add.image(cx, h / 2, 'gacha_shrine_v2'));
  bg.setScale(Math.max(w / bg.width, h / bg.height));
  add(scene.add.rectangle(cx, 46, w, 92, 0x03110f, .78));
  const phase = add(scene.add.text(cx, 35, '宝箱を召喚', { fontFamily: '"Yu Mincho", Meiryo, serif', fontSize: mobile ? '21px' : '26px', color: '#ffe3a4', fontStyle: 'bold' }).setOrigin(.5));
  const sub = add(scene.add.text(cx, 67, '古の宝物庫に、光が集まる…', { fontFamily: 'Meiryo', fontSize: '12px', color: '#bdcfc3' }).setOrigin(.5));
  const sigil = add(scene.add.image(cx, chestY + chestSize * .35, 'gacha_ritual_v2', 2).setDisplaySize(chestSize * 1.6, chestSize * .62).setBlendMode(Phaser.BlendModes.ADD).setAlpha(.55));
  const aura = add(scene.add.image(cx, chestY - 25, 'gacha_ritual_v2', 3).setDisplaySize(chestSize * 1.9, chestSize * 2.2).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0));
  const chest = add(scene.add.image(cx, chestY + 45, 'gacha_ritual_v2', 0).setDisplaySize(chestSize, chestSize).setAlpha(0));
  tween({ targets: chest, y: chestY, alpha: 1, duration: reduced ? 180 : 650, ease: 'Sine.easeOut' });
  if (!reduced) tween({ targets: sigil, alpha: .9, duration: 800, yoyo: true, repeat: -1 });
  for (let i = 0; i < (reduced ? 0 : rare ? 24 : 14); i++) {
    const dot = add(scene.add.circle(cx + Math.sin(i * 2.4) * chestSize * .65, chestY + 60, 1 + i % 3, 0xffdc8c, .8));
    tween({ targets: dot, y: chestY - 170 - i % 5 * 15, alpha: 0, duration: 1400 + i * 30, delay: i * 55, repeat: -1 });
  }
  later(700, () => {
    phase.setText('封印が解ける'); sub.setText('宝箱の中から、光があふれる…'); Audio.playSe('warp');
    tween({ targets: aura, alpha: rare ? .85 : .5, duration: reduced ? 180 : 700 });
    if (!reduced) tween({ targets: chest, angle: { from: -2, to: 2 }, duration: 95, yoyo: true, repeat: 5 });
  });
  later(1550, () => {
    scene.tweens.killTweensOf(chest); chest.setAngle(0).setFrame(1);
    Audio.playSe(rare ? 'levelup' : 'chest');
    phase.setText('装備を獲得'); sub.setText('宝物庫から、新たな力を手に入れた');
    tween({ targets: chest, y: h * .7, alpha: .7, duration: 450 });
    aura.setTint(result.color); tween({ targets: aura, y: h * .37, alpha: rare ? .7 : .35, duration: 450 });
    const item = add(scene.add.image(cx, chestY, equipmentIconTexture(result.texKey)).setFlipX(equipmentIconFlipX(result.texKey)).setDisplaySize(40, 40).setAlpha(0).setName('gacha-result-icon'));
    if (result.tintIcon && result.elementColor !== undefined) item.setTintFill(result.elementColor);
    const iconY = h * .36;
    tween({ targets: item, y: iconY, displayWidth: mobile ? 100 : 130, displayHeight: mobile ? 100 : 130, alpha: 1, duration: reduced ? 150 : 550, ease: 'Back.easeOut' });
    const cardY = h * .57, cardH = h - cardY - 24;
    add(scene.add.rectangle(cx, cardY + cardH / 2, w - 40, cardH, 0x071c18, .96).setStrokeStyle(2, result.color, .8));
    add(scene.add.text(cx, cardY + 27, `${result.grade}ランク`, { fontFamily: '"Yu Mincho", Meiryo, serif', fontSize: mobile ? '26px' : '32px', color, fontStyle: 'bold' }).setOrigin(.5).setName('gacha-result-rank'));
    const name = add(scene.add.text(cx, cardY + 66, result.name, { fontFamily: 'Meiryo', fontSize: mobile ? '15px' : '20px', color: '#fff1d2', fontStyle: 'bold' }).setOrigin(.5).setName('gacha-result-name'));
    while (name.width > w - 68 && parseInt(String(name.style.fontSize)) > 10) name.setFontSize(parseInt(String(name.style.fontSize)) - 1);
    const detail = `${result.category} / ${result.elementName ?? '無属性'}${result.feature ? '\n' + result.feature : ''}`;
    const meta = add(scene.add.text(cx, cardY + 99, detail, { fontFamily: 'Meiryo', fontSize: '11px', color: '#b8cdc0', align: 'center', lineSpacing: 5 }).setOrigin(.5, 0));
    const wrapped = detail.split('\n').map(paragraph => {
      const lines: string[] = []; let line = '';
      for (const char of paragraph) {
        meta.setText(line + char);
        if (line && meta.width > w - 68) { lines.push(line); line = char; }
        else line += char;
      }
      lines.push(line); return lines.join('\n');
    }).join('\n');
    meta.setText(wrapped);
    const buttonY = h - 52;
    add(scene.add.rectangle(cx, buttonY, Math.min(w - 80, 240), 42, 0x765526).setStrokeStyle(1, 0xf2cc78));
    const receive = add(scene.add.text(cx, buttonY, '受け取る', { fontFamily: 'Meiryo', fontSize: '17px', color: '#fff0bd', padding: { x: 30, y: 12 } }).setOrigin(.5).setName('gacha-receive'));
    later(550, () => receive.setInteractive({ useHandCursor: true }).once('pointerdown', () => { Audio.playSe('click'); dispose(); onClose(); }));
  });
  return dispose;
}
