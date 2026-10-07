import { katanaSlashColor } from './equipmentAccessories';
import { requestEquipmentArt } from './lazyEquipmentArt';
import { isTwoHanded } from './equipmentRules';
import Phaser from 'phaser';
import { starWeaponKey } from './equipmentTraits';
import { LegendaryAura } from './legendaryAura';
import { HELD_DIRECTION_FRAME, HELD_EQUIPMENT_KEYS, heldArtSize, heldGrip, heldHandPose } from './equipmentAppearance';
import type { Dir, Shield, Weapon } from './types';
import { playerAction } from './playerAnimation';
import { PLAYER_FRAME_SIZE, type PlayerGender, type PlayerVisualFrame } from './playerAppearance';

/** Persistent equipment layers, including a waist scabbard for sheathed katana. */
export class EquipmentRenderer {
  readonly weapon: Phaser.GameObjects.Image;
  readonly offhand: Phaser.GameObjects.Image;
  readonly scabbard: Phaser.GameObjects.Image;
  readonly waistFitting: Phaser.GameObjects.Image;
  private heroGlow?: Phaser.FX.Glow;
  private swordAura: LegendaryAura;
  private shieldAura: LegendaryAura;
  private scabbardAura: LegendaryAura;
  private fittingAura: LegendaryAura;
  constructor(private scene: Phaser.Scene) {
    this.weapon = scene.add.image(0,0,'w_soldier_blade').setVisible(false);
    this.waistFitting = scene.add.image(0, 0, 'katana_waist_fitting_v3').setVisible(false);
    this.scabbard = scene.add.image(0, 0, 'katana_scabbard_v2').setVisible(false);
    this.offhand = scene.add.image(0,0,'s_iron_round').setVisible(false);
    this.swordAura = new LegendaryAura(scene, this.weapon, 'sword');
    this.shieldAura = new LegendaryAura(scene, this.offhand, 'shield');
    this.scabbardAura = new LegendaryAura(scene, this.scabbard, 'scabbard');
    this.fittingAura = new LegendaryAura(scene, this.waistFitting, 'scabbard');
  }
  update(body: Phaser.GameObjects.Image, weapon: Weapon | null, shield: Shield | null, dir: Dir, frame: PlayerVisualFrame, gender: PlayerGender, elapsed = 0, enabled = true) {
    this.scabbardAura.enabled = this.fittingAura.enabled = enabled && weapon?.key === 'w_katana_divine';
    this.scabbardAura.alternate = this.fittingAura.alternate = !!weapon?.starred;
    const second = weapon?.dual ? weapon : isTwoHanded(weapon) ? null : shield;
    this.swordAura.enabled = enabled && (weapon?.key === 'w_katana_divine' || !weapon?.starred && (weapon?.key === 'w_hero_sword' || weapon?.key === 'w_hw_emedral'));
    this.shieldAura.enabled = enabled && (second?.key === 's_arcadia_guard' || second?.key === 's_hw_emerald');
    this.swordAura.emerald = weapon?.key === 'w_hw_emedral';
    this.shieldAura.emerald = second?.key === 's_hw_emerald';
    // PreFX clips weapons in the narrow, offset mobile viewport.
    // Attach PostFX only for Arcadia: inactive PostFX controllers still draw.
    const glowing = enabled && !weapon?.starred && weapon?.key === 'w_hero_sword';
    if (glowing && !this.heroGlow) {
      this.heroGlow = this.weapon.postFX?.addGlow(0xffd35a, 4, 1, false, .1, 12);
    } else if (!glowing && this.heroGlow) {
      this.weapon.postFX.remove(this.heroGlow);
      this.heroGlow = undefined;
    }
    const show = enabled && body.visible && body.active && frame !== 'down';
    const katana = show && weapon?.weaponType === 'katana';
    const action = playerAction(frame);
    const unit = Math.abs(body.scaleY) * (body.frame.realWidth || PLAYER_FRAME_SIZE) / 40;
    this.scabbard.setVisible(!!katana && dir !== 'down');
    this.waistFitting.setVisible(!!katana && dir === 'down');
    if (katana) {
      const sheathKey = `sheath_${weapon?.starred ? 'star_' : ''}${weapon!.key}`;
      requestEquipmentArt(sheathKey);
      if (this.scene.textures.exists(sheathKey)) this.scabbard.setTexture(sheathKey);
      this.scabbard.setOrigin(.78, .5).setDisplaySize(unit * 25, unit * 5)
        .setPosition(body.x + unit * (dir === 'left' ? 5 : -2), body.y + unit * 5)
        .setRotation(body.rotation + (dir === 'left' ? -.16 : .16))
        .setFlipX(dir === 'left').setDepth(body.depth + (dir === 'up' ? -.15 : .16)).setAlpha(body.alpha);
      this.scabbard.clearTint();
      if (dir === 'down') {
        // Seen along its length: only the rounded mouth at the left hip is exposed.
        this.waistFitting.setDisplaySize(unit * 3.8, unit * 3.3).setOrigin(.5)
          .setPosition(body.x + unit * 6, body.y + unit * 4.5)
          .setRotation(body.rotation - .15).setDepth(body.depth + .18)
          .setAlpha(body.alpha).setTint(katanaSlashColor(weapon!));
      } else if (dir === 'up') {
        // Foreshortened behind the waist, with a short tip below the belt.
        this.scabbard.setOrigin(.78, .5).setDisplaySize(unit * 10, unit * 2.6)
          .setPosition(body.x - unit * 5.5, body.y + unit * 3)
          .setRotation(body.rotation - Math.PI / 2 - .12).setFlipX(false)
          .setDepth(body.depth + .12);
      }
    }
    for (const [sprite,item,offhand] of [[this.weapon,weapon,false],[this.offhand,second,true]] as const) {
      if (!show || !item || (offhand && weapon?.starred && weapon.dual) || ('weaponType' in item && !HELD_EQUIPMENT_KEYS.has(item.key) && !item.key.startsWith('w_hw_'))) { sprite.setVisible(false); continue; }
      const type = 'weaponType' in item ? item.weaponType : 'shield';
      if (type === 'katana' && action !== 'attack') { sprite.setVisible(false); continue; }
      const key = `held_${item.key}`;
      // Keep old saves readable if an asset fails to load.
      const starred = 'starred' in item && item.starred;
      const hasArt = !starred && this.scene.textures.exists(key), texture = starred ? starWeaponKey(item.key) : hasArt ? key : item.key;
      requestEquipmentArt(texture);
      const artFrame = hasArt ? HELD_DIRECTION_FRAME[dir] : undefined;
      if (sprite.texture.key !== texture || (hasArt && String(sprite.frame.name) !== String(artFrame))) sprite.setTexture(texture,artFrame);
      const pose = heldHandPose(dir,frame,gender,offhand,elapsed,type,body.texture.key);
      const paintedWeapon = item.key.startsWith('w_secret_') || item.key.startsWith('w_hw_');
      // Painted melee art already has its blade upright. Keep the idle grip upright
      // in every facing; heldHandPose supplies only the swing during an attack.
      if (item.key === 'w_hw_coffin' && !starred) pose.angle += Math.PI;
      if (paintedWeapon && type === 'bow') pose.angle = {up:0,right:Math.PI/2,down:Math.PI,left:-Math.PI/2}[dir];
      if (paintedWeapon && type === 'handgun') pose.angle = {up:-Math.PI/2,right:0,down:Math.PI/2,left:0}[dir];
      if (item.key === 'w_hero_sword') {
        // Bring the front-facing and right-facing grip closer to the body.
        if (dir === 'right') { pose.x -= 7; pose.y -= 5; }
        else if (dir === 'down') { pose.x -= 3; pose.y -= 3; }
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
      if (type === 'katana') pose.x = 20;
      // Keep every greatsword's grip just left of the hand in all poses.
      if (type === 'greatsword') pose.x = 16;
      if (type === 'katana') {
        const heading = {right:0, down:Math.PI/2, left:Math.PI, up:-Math.PI/2}[dir];
        const sweep = Math.min(1, elapsed / 130);
        const recover = Math.max(0, Math.min(1, (elapsed - 145) / 65));
        const reach = Math.sin(sweep * Math.PI / 2) * (1 - recover);
        pose.x = 20 + Math.cos(heading) * 9 * reach;
        pose.y = 25 + Math.sin(heading) * 7 * reach;
        pose.angle = heading - .85 + sweep * 1.7 - Math.PI / 4;
        pose.depth = .22;
        if (recover >= 1) { sprite.setVisible(false); continue; }
      }
      if (starred && 'dual' in item && item.dual) pose.x = 20;
      if (starred) pose.angle += type === 'katana' ? Math.PI / 2 : type === 'handgun' ? Math.PI * 3 / 4 : Math.PI / 4;
      // Hand anchors use a 40-unit art space, independent of atlas resolution.
      const frameSize = body.frame.realWidth || PLAYER_FRAME_SIZE;
      const artScale = frameSize / 40;
      const dx = (pose.x - body.originX * 40) * body.scaleX * artScale;
      const dy = (pose.y - body.originY * 40) * body.scaleY * artScale;
      const cosine = Math.cos(body.rotation), sine = Math.sin(body.rotation);
      // Pin the actual center of Arcadia's handle to the per-frame hand anchor.
      const [ox,oy] = starred ? (type === 'bow' || type === 'handgun' ? [.5,.5] : 'dual' in item && item.dual ? [.5,.8] : [.8,.8]) : type === 'katana' ? [.2,.8] : item.key === 'w_hw_coffin' ? [.5,.16] : item.key === 'w_hero_sword' ? [.5,.823] : hasArt || paintedWeapon ? heldGrip(type,dir) : [.5,.65];
      const size = heldArtSize(type) * (item.key === 's_hw_emerald' ? 1.2 : item.key === 'w_hero_sword' ? 1.35 : 1) * Math.abs(body.scaleY) * artScale / .85;
      sprite.setVisible(true).setOrigin(ox,oy).setPosition(body.x + dx*cosine - dy*sine,body.y + dx*sine + dy*cosine)
        .setDisplaySize(size,size).setRotation(body.rotation + pose.angle).setFlipX(paintedWeapon && type === 'handgun' ? dir === 'left' : !!weapon?.dual && offhand && (dir === 'down' || dir === 'up'))
        .setDepth(body.depth + pose.depth).setAlpha(body.alpha).clearTint();
    }
  }
}
