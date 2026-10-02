import Phaser from 'phaser';
import { HELD_DIRECTION_FRAME, HELD_EQUIPMENT_KEYS, heldArtSize, heldGrip, heldHandPose } from './equipmentAppearance';
import type { Dir, Shield, Weapon } from './types';
import { playerAction } from './playerAnimation';
import { PLAYER_FRAME_SIZE, type PlayerGender, type PlayerVisualFrame } from './playerAppearance';

/** Two persistent sprites; no combined textures or animation-frame generation at runtime. */
export class EquipmentRenderer {
  readonly weapon: Phaser.GameObjects.Image;
  readonly offhand: Phaser.GameObjects.Image;
  private heroGlow?: Phaser.FX.Glow;
  constructor(private scene: Phaser.Scene) {
    this.weapon = scene.add.image(0,0,'w_soldier_blade').setVisible(false);
    this.offhand = scene.add.image(0,0,'s_iron_round').setVisible(false);
    this.heroGlow = this.weapon.preFX?.addGlow(0xffd35a, 4, 1, false, .1, 12);
    this.heroGlow?.setActive(false);
  }
  update(body: Phaser.GameObjects.Image, weapon: Weapon | null, shield: Shield | null, dir: Dir, frame: PlayerVisualFrame, gender: PlayerGender, elapsed = 0, enabled = true) {
    const second = weapon?.dual ? weapon : shield;
    this.heroGlow?.setActive(enabled && weapon?.key === 'w_hero_sword');
    const show = enabled && body.visible && body.active && frame !== 'down';
    for (const [sprite,item,offhand] of [[this.weapon,weapon,false],[this.offhand,second,true]] as const) {
      if (!show || !item || !HELD_EQUIPMENT_KEYS.has(item.key)) { sprite.setVisible(false); continue; }
      const type = 'weaponType' in item ? item.weaponType : 'shield';
      const key = `held_${item.key}`;
      // Keep old saves readable if an asset fails to load.
      const hasArt = this.scene.textures.exists(key), texture = hasArt ? key : item.key;
      const artFrame = hasArt ? HELD_DIRECTION_FRAME[dir] : undefined;
      if (sprite.texture.key !== texture || (hasArt && String(sprite.frame.name) !== String(artFrame))) sprite.setTexture(texture,artFrame);
      const pose = heldHandPose(dir,frame,gender,offhand,elapsed,type,body.texture.key);
      if (item.key === 'w_hero_sword') {
        const action = playerAction(frame);
        const raised = {down:-.15,left:.5,right:-.5,up:.2}[dir];
        const finish = {down:2.45,left:-1.65,right:1.65,up:-.7}[dir];
        if (action === 'windup') {
          const progress = Math.min(1, elapsed / 180);
          const ease = 1 - Math.pow(1 - progress, 3);
          pose.angle = (dir === 'left' ? -.3 : dir === 'right' ? .3 : -.2) * (1 - ease) + raised * ease;
          pose.depth = .18;
        } else if (action === 'attack') {
          const progress = Math.min(1, elapsed / 140);
          const ease = progress * progress;
          pose.angle = raised + (finish - raised) * ease;
          if (elapsed > 170) {
            const recover = Math.min(1, (elapsed - 170) / 90);
            pose.angle += ((dir === 'left' ? -.3 : dir === 'right' ? .3 : -.2) - finish) * recover;
          }
          pose.depth = dir === 'up' ? -.12 : .18;
        }
      }
      // Hand anchors use a 40-unit art space, independent of atlas resolution.
      const frameSize = body.frame.realWidth || PLAYER_FRAME_SIZE;
      const artScale = frameSize / 40;
      const dx = (pose.x - body.originX * 40) * body.scaleX * artScale;
      const dy = (pose.y - body.originY * 40) * body.scaleY * artScale;
      const cosine = Math.cos(body.rotation), sine = Math.sin(body.rotation);
      // The large glowing icon needs its own grip alignment instead of the directional atlas origin.
      const [ox,oy] = item.key === 'w_hero_sword' ? [.42,.88] : hasArt ? heldGrip(type,dir) : [.5,.65];
      const size = heldArtSize(type) * (item.key === 'w_hero_sword' ? 1.75 : 1) * Math.abs(body.scaleY) * artScale / .85;
      sprite.setVisible(true).setOrigin(ox,oy).setPosition(body.x + dx*cosine - dy*sine,body.y + dx*sine + dy*cosine)
        .setDisplaySize(size,size).setRotation(body.rotation + pose.angle).setFlipX(!!weapon?.dual && offhand && (dir === 'down' || dir === 'up'))
        .setDepth(body.depth + pose.depth).setAlpha(body.alpha).clearTint();
    }
  }
}
