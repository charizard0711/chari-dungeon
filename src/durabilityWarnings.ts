import type Phaser from 'phaser';
import type { Weapon, Shield } from './types';

export const DURABILITY_WARNING_ART = {
  ui_durability_weapon: 'assets/ui/durability-warning-v1/weapon.png',
  ui_durability_shield: 'assets/ui/durability-warning-v1/shield.png'
} as const;

export const DURABILITY_WARNING_RATIO = 0.2;
export const DURABILITY_WARNING_PERIOD_MS = 1800;

type Equipment = Pick<Weapon | Shield, 'dur' | 'durMax'>;
type Equipped = { weapon: Weapon | null; shield: Shield | null };

export function isDurabilityLow(equipment: Equipment | null | undefined): boolean {
  return !!equipment && equipment.dur > 0 && equipment.durMax > 0
    && equipment.dur <= equipment.durMax * DURABILITY_WARNING_RATIO;
}

/** Fixed HUD notices: no input zones, timers or changes to the equipment itself. */
export class DurabilityWarnings {
  private entries: {
    kind: 'weapon' | 'shield'; image: Phaser.GameObjects.Image;
    equipment?: Equipment; shownAt: number;
  }[];

  constructor(scene: Phaser.Scene, private map: { x: number; y: number; width: number }, mobile: boolean) {
    const width = mobile ? 154 : 230;
    this.entries = (['weapon', 'shield'] as const).map(kind => {
      const image = scene.add.image(0, 0, `ui_durability_${kind}`).setOrigin(1, 0).setDepth(64).setVisible(false);
      image.setDisplaySize(width, width * image.height / image.width);
      return { kind, image, shownAt: 0 };
    });
  }

  update(player: Equipped, now: number, show: boolean) {
    let y = this.map.y + 8;
    for (const entry of this.entries) {
      const equipment = entry.kind === 'shield' && (player.weapon?.dual || player.weapon?.weaponType === 'bow')
        ? null : player[entry.kind];
      if (!show || !isDurabilityLow(equipment)) {
        entry.image.setVisible(false);
        entry.equipment = undefined;
        continue;
      }
      if (entry.equipment !== equipment) {
        entry.equipment = equipment!;
        entry.shownAt = now;
      }
      // Gently blink without disappearing completely, so the message remains readable.
      const alpha = 0.55 + 0.45 * (1 + Math.cos((now - entry.shownAt) * Math.PI * 2 / DURABILITY_WARNING_PERIOD_MS)) / 2;
      entry.image.setPosition(this.map.x + this.map.width - 8, y).setVisible(true).setAlpha(alpha);
      y += entry.image.displayHeight + 2;
    }
  }

  destroy() {
    for (const entry of this.entries) entry.image.destroy();
    this.entries = [];
  }
}
