import Phaser from 'phaser';

export type LegendaryAuraKind = 'sword' | 'shield' | 'scabbard';
/** Two helices share a blade axis; phase travels upward like a barber pole. */
export function spiralPoint(t: number, clock: number, strand: number) {
  const phase = t * Math.PI * 5.2 - clock * .0052 + strand * Math.PI;
  return { x: Math.sin(phase), front: Math.cos(phase) >= 0 };
}

/** Follows the target's displayed transform, including UI container ownership. */
export class LegendaryAura {
  private back: Phaser.GameObjects.Graphics;
  private front: Phaser.GameObjects.Graphics;
  private smoke: Phaser.GameObjects.Image[] = [];
  private painted: Phaser.GameObjects.Image[] = [];
  private disposed = false;
  enabled = true;
  emerald = false;
  alternate = false;
  artRotation = 0;
  constructor(private scene: Phaser.Scene, private target: Phaser.GameObjects.Image, public kind: LegendaryAuraKind) {
    this.back = scene.add.graphics(); this.front = scene.add.graphics();
    if (kind === 'shield') this.smoke = Array.from({length: 3}, () => scene.add.image(0, 0, 'fx_shadow'));
    this.painted = Array.from({length: 3}, (_, i) => scene.add.image(0, 0, i % 2 ? 'fx_hw_aura_b' : 'fx_hw_aura_a').setVisible(false));
    const parent = target.parentContainer;
    if (parent) {
      parent.addAt([this.back, ...this.smoke, ...this.painted], parent.getIndex(target));
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
    for (const cloud of this.smoke) cloud.setVisible(visible && this.kind === 'shield');
    for (const cloud of this.painted) cloud.setVisible(visible && this.emerald);
    if (!visible) return;
    const divineKatana = s.texture.key === 'w_katana_divine' || s.texture.key === 'star_w_katana_divine';
    const reverseKatana = s.texture.key === 'star_w_katana_divine';
    const diagonalBlade = s.texture.key === 'icon_w_hero_sword' || divineKatana;
    const now = this.scene.time.now, w = s.displayWidth, h = s.displayHeight, rotation = s.rotation + (diagonalBlade ? 0 : this.artRotation);
    for (const [g, offset] of [[this.back, -.001], [this.front, .001]] as const) {
      g.setPosition(s.x, s.y).setRotation(rotation).setDepth(s.depth + offset).setAlpha(s.alpha);
    }
    if (this.emerald) {
      this.smoke.forEach(cloud => cloud.setVisible(false));
      const cx = (.5 - s.originX) * w, cy = (.5 - s.originY) * h;
      this.painted.forEach((cloud, i) => {
        const phase = (now / 2600 + i / 3) % 1;
        const bow = this.kind === 'sword';
        const drift = phase * h * (bow ? .045 : .15);
        const dx = cx + Math.sin(now / 950 + i * 2) * w * .035, dy = cy - drift;
        cloud.setPosition(s.x + dx * Math.cos(rotation) - dy * Math.sin(rotation), s.y + dx * Math.sin(rotation) + dy * Math.cos(rotation))
          .setDisplaySize(w * (bow ? .50 + phase * .06 : 1.03 + phase * .25), h * (bow ? .85 + phase * .06 : 1.03 + phase * .20))
          .setRotation(rotation + Math.sin(now / 1800 + i) * .09).setFlipX(i === 1)
          .setAlpha(Math.sin(phase * Math.PI) * .60 * s.alpha).setDepth(s.depth - .002 - i * .001);
      });
    } else if (this.kind === 'scabbard') {
      for (let strand = 0; strand < 2; strand++) for (let i = 1; i <= 48; i++) {
        const point = (t: number) => {
          const wave = spiralPoint(t, now, strand);
          const x = (.74 - s.originX - t * .65) * w;
          return {x: s.flipX ? -x : x, y:(.5 - s.originY) * h + wave.x * h * .45, front:wave.front};
        };
        const a = point((i - 1) / 48), b = point(i / 48), g = b.front ? this.front : this.back;
        g.lineStyle(Math.max(.6, Math.min(w,h) * .06), strand ? 0xc9f9ff : this.alternate ? 0xd499ff : 0xffe7a0, b.front ? .85 : .38)
          .lineBetween(a.x,a.y,b.x,b.y);
      }
    } else if (this.kind === 'sword') {
      for (let strand = 0; strand < 2; strand++) {
        for (let i = 1; i <= 64; i++) {
          const a = spiralPoint((i - 1) / 64, now, strand), b = spiralPoint(i / 64, now, strand);
          const g = b.front ? this.front : this.back;
          const x0 = (.5 - s.originX) * w, radius = w * .095;
          const y = (t: number) => (.70 - s.originY - t * .65) * h;
          if (diagonalBlade) {
            // Follow the painted blade from the guard to the tip, not the square icon's center.
            const dx = (divineKatana ? (reverseKatana ? -.42 : .45) : .48) * w, dy = (divineKatana ? -.51 : -.525) * h, length = Math.hypot(dx, dy);
            const point = (t: number, wave: number) => ({
              x: ((divineKatana ? (reverseKatana ? .49 : .51) : .44) - s.originX) * w + dx * t + (divineKatana ? (reverseKatana ? -.025 : .035) * Math.sin(t * Math.PI) * w : 0) - dy / length * wave * w * (divineKatana ? .035 : .065) * (1 - .7 * t),
              y: ((divineKatana ? .54 : .59) - s.originY) * h + dy * t + dx / length * wave * w * (divineKatana ? .035 : .065) * (1 - .7 * t)
            });
            const start = point((i - 1) / 64, a.x), end = point(i / 64, b.x);
            g.lineStyle(Math.max(.65, w * .017), strand ? 0xc9f9ff : reverseKatana ? 0xd499ff : 0xffe7a0, b.front ? .85 : .38)
              .lineBetween(start.x, start.y, end.x, end.y);
            continue;
          }
          g.lineStyle(Math.max(.65, w * .017), strand ? 0xc9f9ff : reverseKatana ? 0xd499ff : 0xffe7a0, b.front ? .85 : .38)
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
    this.back.destroy(); this.front.destroy(); this.smoke.forEach(s => s.destroy()); this.painted.forEach(s => s.destroy());
  }
}
