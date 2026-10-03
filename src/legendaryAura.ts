import Phaser from 'phaser';

export type LegendaryAuraKind = 'sword' | 'shield';
/** Two helices share a blade axis; phase travels upward like a barber pole. */
export function spiralPoint(t: number, clock: number, strand: number) {
  const phase = t * Math.PI * 5.2 - clock * .0026 + strand * Math.PI;
  return { x: Math.sin(phase), front: Math.cos(phase) >= 0 };
}

/** Follows the target's displayed transform, including UI container ownership. */
export class LegendaryAura {
  private back: Phaser.GameObjects.Graphics;
  private front: Phaser.GameObjects.Graphics;
  private smoke: Phaser.GameObjects.Image[] = [];
  private disposed = false;
  enabled = true;
  constructor(private scene: Phaser.Scene, private target: Phaser.GameObjects.Image, private kind: LegendaryAuraKind) {
    this.back = scene.add.graphics(); this.front = scene.add.graphics();
    if (kind === 'shield') this.smoke = Array.from({length: 3}, () => scene.add.image(0, 0, 'fx_shadow'));
    const parent = target.parentContainer;
    if (parent) {
      parent.addAt([this.back, ...this.smoke], parent.getIndex(target));
      parent.addAt(this.front, parent.getIndex(target) + 1);
    }
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.draw, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    target.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
  }
  private draw() {
    if (this.disposed) return;
    const s = this.target, visible = this.enabled && s.active && s.visible && s.alpha > 0;
    this.back.clear().setVisible(visible); this.front.clear().setVisible(visible);
    for (const cloud of this.smoke) cloud.setVisible(visible);
    if (!visible) return;
    const now = this.scene.time.now, w = s.displayWidth, h = s.displayHeight;
    for (const [g, offset] of [[this.back, -.001], [this.front, .001]] as const) {
      g.setPosition(s.x, s.y).setRotation(s.rotation).setDepth(s.depth + offset).setAlpha(s.alpha);
    }
    if (this.kind === 'sword') {
      for (let strand = 0; strand < 2; strand++) {
        for (let i = 1; i <= 64; i++) {
          const a = spiralPoint((i - 1) / 64, now, strand), b = spiralPoint(i / 64, now, strand);
          const g = b.front ? this.front : this.back;
          const x0 = (.5 - s.originX) * w, radius = w * .095;
          const y = (t: number) => (.70 - s.originY - t * .65) * h;
          g.lineStyle(Math.max(.65, w * .017), strand ? 0xc9f9ff : 0xffe7a0, b.front ? .85 : .38)
            .lineBetween(x0 + a.x * radius, y((i - 1) / 64), x0 + b.x * radius, y(i / 64));
        }
      }
    } else {
      this.smoke.forEach((cloud, i) => {
        const phase = (now / 2400 + i / 3) % 1;
        const size = Math.max(w, h) * (s.parentContainer ? 1 + phase * .65 : 1.3 + phase * 1.1);
        const dx = (.5 - s.originX) * w + Math.sin(now / 650 + i * 2) * w * .08;
        const dy = (.5 - s.originY) * h - phase * h * (s.parentContainer ? .10 : .28);
        cloud.setPosition(s.x + dx * Math.cos(s.rotation) - dy * Math.sin(s.rotation), s.y + dx * Math.sin(s.rotation) + dy * Math.cos(s.rotation))
          .setDisplaySize(size, size).setRotation(now * .00015 * (i % 2 ? -1 : 1) + i * 2)
          .setAlpha(Math.sin(phase * Math.PI) * .48 * s.alpha).setDepth(s.depth - .002);
      });
    }
  }
  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.draw, this);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.target.off(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    this.back.destroy(); this.front.destroy(); this.smoke.forEach(s => s.destroy());
  }
}
