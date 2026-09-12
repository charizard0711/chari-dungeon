import Phaser from 'phaser';
import { HELD_DIRECTION_FRAME, HELD_EQUIPMENT_KEYS, heldArtSize, heldGrip, heldHandPose } from './equipmentAppearance';
import type { Dir, Shield, Weapon } from './types';
import type { PlayerGender, PlayerVisualFrame } from './playerAppearance';

/** Two persistent sprites; no combined textures or animation-frame generation at runtime. */
export class EquipmentRenderer {
  readonly weapon: Phaser.GameObjects.Image;
  readonly offhand: Phaser.GameObjects.Image;
  constructor(private scene: Phaser.Scene) {
    this.weapon = scene.add.image(0,0,'w_soldier_blade').setVisible(false);
    this.offhand = scene.add.image(0,0,'s_iron_round').setVisible(false);
  }
  update(body: Phaser.GameObjects.Image, weapon: Weapon | null, shield: Shield | null, dir: Dir, frame: PlayerVisualFrame, gender: PlayerGender, elapsed = 0, enabled = true) {
    const second = weapon?.dual ? weapon : shield;
    const show = enabled && body.visible && body.active && frame !== 'down';
    for (const [sprite,item,offhand] of [[this.weapon,weapon,false],[this.offhand,second,true]] as const) {
      if (!show || !item || !HELD_EQUIPMENT_KEYS.has(item.key)) { sprite.setVisible(false); continue; }
      const type = 'weaponType' in item ? item.weaponType : 'shield';
      const key = `held_${item.key}`;
      // Keep old saves readable if an asset fails to load.
      const hasArt = this.scene.textures.exists(key), texture = hasArt ? key : item.key;
      const artFrame = hasArt ? HELD_DIRECTION_FRAME[dir] : undefined;
      if (sprite.texture.key !== texture || (hasArt && String(sprite.frame.name) !== String(artFrame))) sprite.setTexture(texture,artFrame);
      const pose = heldHandPose(dir,frame,gender,offhand,elapsed,type);
      const dx = (pose.x - body.originX * 40) * body.scaleX, dy = (pose.y - body.originY * 40) * body.scaleY;
      const cosine = Math.cos(body.rotation), sine = Math.sin(body.rotation);
      const [ox,oy] = hasArt ? heldGrip(type,dir) : [.5,.65];
      const size = heldArtSize(type) * Math.abs(body.scaleY) / .85;
      sprite.setVisible(true).setOrigin(ox,oy).setPosition(body.x + dx*cosine - dy*sine,body.y + dx*sine + dy*cosine)
        .setDisplaySize(size,size).setRotation(body.rotation + pose.angle).setFlipX(!!weapon?.dual && offhand && (dir === 'down' || dir === 'up'))
        .setDepth(body.depth + pose.depth).setAlpha(body.alpha).clearTint();
    }
  }
}
