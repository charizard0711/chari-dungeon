import Phaser from 'phaser';

/** A self-contained guide panel with Japanese character wrapping. */
export function createGuideModal(scene: Phaser.Scene, steps: readonly (readonly [string, string])[], onClose: () => void) {
  const { width: screenW, height: screenH } = scene.scale;
  const width = Math.min(screenW - 32, 520), height = Math.min(screenH - 40, 360);
  const x = (screenW - width) / 2, y = (screenH - height) / 2;
  const card = scene.add.container(0, 0).setDepth(400).setName('controls-guide-modal');
  const shade = scene.add.rectangle(screenW / 2, screenH / 2, screenW, screenH, 0x02080c, .84).setInteractive();
  const panel = scene.add.graphics();
  panel.fillStyle(0x102421).fillRoundedRect(x, y, width, height, 14);
  panel.lineStyle(2, 0xc5a065).strokeRoundedRect(x, y, width, height, 14);
  panel.lineStyle(1, 0x45665a).lineBetween(x + 24, y + 76, x + width - 24, y + 76);
  const fontFamily = '"Yu Gothic UI", "Meiryo", sans-serif';
  const title = scene.add.text(x + 24, y + 28, '', { fontFamily, fontSize: width < 400 ? '18px' : '21px', color: '#ffe4aa', fontStyle: 'bold' });
  const body = scene.add.text(x + 24, y + 98, '', { fontFamily, fontSize: '15px', color: '#e0e9de', lineSpacing: 9 }).setName('controls-guide-body');
  const wrap = (value: string) => {
    const maxWidth = width - 48;
    return value.split('\n').map(paragraph => {
      const lines: string[] = []; let line = '';
      for (const char of paragraph) {
        body.setText(line + char);
        if (line && body.width > maxWidth) { lines.push(line); line = char; }
        else line += char;
      }
      lines.push(line); return lines.join('\n');
    }).join('\n');
  };
  let step = 0;
  const close = () => { card.destroy(true); onClose(); };
  const nextBackground = scene.add.rectangle(x + width - 92, y + height - 38, 136, 42, 0x38554a).setStrokeStyle(1, 0xc5a065);
  const next = scene.add.text(x + width - 92, y + height - 38, '', { fontFamily, fontSize: '16px', color: '#ffe4aa', padding: { x: 10, y: 10 } }).setOrigin(.5).setName('controls-guide-next').setInteractive({ useHandCursor: true });
  const skip = scene.add.text(x + 24, y + height - 38, '閉じる', { fontFamily, fontSize: '14px', color: '#b8c8bc', padding: { x: 8, y: 10 } }).setOrigin(0, .5).setInteractive({ useHandCursor: true }).on('pointerdown', close);
  const render = () => {
    title.setText(`${step + 1}/${steps.length}　${steps[step][0]}`);
    body.setText(wrap(steps[step][1]));
    next.setText(step === steps.length - 1 ? '冒険を始める' : '次へ ›');
  };
  next.on('pointerdown', () => { if (step === steps.length - 1) close(); else { step++; render(); } });
  card.add([shade, panel, title, body, nextBackground, next, skip]); render();
  return card;
}
