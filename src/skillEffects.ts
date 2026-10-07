import Phaser from 'phaser';
import type { Dir, Vec2, WeaponType } from './types';
import { TILE } from './textures';
import { directionVector } from './weaponSkills';

export const skillImpactTime = (type: WeaponType) => type === 'bow' ? 450 : type === 'handgun' ? 100 : type === 'greatsword' ? 270 : type === 'dagger' ? 90 : 150;
const world = (p: Vec2) => ({ x: (p.x + .5) * TILE, y: (p.y + .5) * TILE });
function art(scene: Phaser.Scene, key: string, x: number, y: number, w: number, h = w, additive = true) {
  const image = scene.add.image(x, y, key).setDisplaySize(w, h).setDepth(24).setName('painted-skill-fx');
  if (additive) image.setBlendMode(Phaser.BlendModes.ADD);
  return image;
}
function fade(scene: Phaser.Scene, sprite: Phaser.GameObjects.Image, duration: number, delay = 0) {
  scene.tweens.add({ targets: sprite, alpha: 0, duration, delay, onComplete: () => sprite.destroy() });
}
export function paintedImpact(scene: Phaser.Scene, tile: Vec2, color = 0xffffff) {
  const p = world(tile), flash = art(scene, 'fx_impact', p.x, p.y, TILE * 1.6).setTint(color);
  scene.tweens.add({ targets: flash, displayWidth: TILE * 2.0, displayHeight: TILE * 2.0, alpha: 0, duration: 280, onComplete: () => flash.destroy() });
}
export function paintedVanish(scene: Phaser.Scene, tile: Vec2) {
  const p = world(tile), mist = art(scene, 'fx_shadow', p.x, p.y, TILE * 1.6, TILE * 1.6, false).setAlpha(.65);
  scene.tweens.add({targets:mist,displayWidth:TILE*2.1,displayHeight:TILE*2.1,alpha:0,duration:340,onComplete:()=>mist.destroy()});
}

export function paintedStun(scene: Phaser.Scene, tile: Vec2) {
  const p = world(tile), burst = art(scene, 'fx_skill_stun_v3', p.x, p.y - TILE * .4, TILE * 1.15);
  scene.tweens.add({ targets: burst, displayWidth: TILE * 1.45, displayHeight: TILE * 1.45, alpha: 0,
    duration: 650, ease: 'Cubic.out', onComplete: () => burst.destroy() });
}

/** Art is emitted from the wielder and follows only tiles validated by planSkill. */
export function playPaintedSkill(scene: Phaser.Scene, type: WeaponType, origin: Vec2, dir: Dir, tiles: Vec2[], weaponKey: string, color: number) {
  const p = world(origin), d = directionVector(dir), angle = Math.atan2(d.y, d.x);
  const end = world(tiles[tiles.length - 1] ?? origin);
  const distance = Math.hypot(end.x - p.x, end.y - p.y);
  const emit = (key: string, x: number, y: number, w: number, h = w) => art(scene, key, x, y, w, h);
  const crescent = (x: number, y: number, size: number, rotation: number, turn: number, duration: number, delay = 0) => {
    const slash = emit('fx_crescent', x, y, size).setRotation(rotation).setAlpha(0);
    if (type === 'dagger') slash.setTint(0xd4a7ff);
    if (type === 'greatsword') slash.setTint(0xffc488);
    if (type === 'longsword') slash.setTint(0xa1c7ff);
    scene.tweens.add({ targets: slash, alpha: .9, duration: 55, delay });
    scene.tweens.add({ targets: slash, rotation: rotation + turn, duration, delay, ease: 'Cubic.out' });
    fade(scene, slash, duration - 60, delay + 60);
  };
  if (type === 'greatsword') {
    crescent(p.x, p.y, TILE * 3.2, angle, Math.PI * 2.1, 430);
    crescent(p.x, p.y, TILE * 2.7, angle + Math.PI, Math.PI * 2.1, 430, 55);
    scene.cameras.main.shake(130, .0015);
  } else if (type === 'longsword') {
    crescent(p.x + d.x * TILE * .35, p.y + d.y * TILE * .35, TILE * 2.8, angle + .7, 2.8, 340);
  } else if (type === 'dagger') {
    const mist = art(scene, 'fx_skill_dagger_v3', p.x, p.y, TILE * 1.7, TILE * 1.1, false).setAlpha(.65);
    fade(scene, mist, 300);
    const last = tiles[tiles.length - 1];
    const target = last ? world(last) : {x:p.x+d.x*TILE, y:p.y+d.y*TILE};
    crescent(target.x, target.y, TILE * 1.7, angle - .5, 3.0, 250);
  } else if (type === 'bow') {
    const bow = art(scene, weaponKey, p.x + d.x * 8, p.y + d.y * 8, TILE * 1.6, TILE * 2.1, false).setRotation(angle + Math.PI / 2);
    scene.tweens.add({ targets: bow, x: bow.x - d.x * 4, y: bow.y - d.y * 4, duration: 130, yoyo: true });
    fade(scene, bow, 100, 170);
    const charge = emit('fx_impact', p.x + d.x * 13, p.y + d.y * 13, TILE * 2.2).setAlpha(.75);
    fade(scene, charge, 160);
    if (distance > 0) scene.time.delayedCall(150, () => {
      const arrow = emit('fx_arrow', p.x, p.y, TILE * 3.8, TILE * 1.3).setOrigin(1, .5).setRotation(angle);
      scene.tweens.add({ targets: arrow, x: end.x, y: end.y, duration: 300, ease: 'Linear', onComplete: () => arrow.destroy() });
    });
  } else if (type === 'handgun') {
    for (let shot = 0; shot < 5; shot++) scene.time.delayedCall(shot * 110, () => {
      const muzzle = emit('fx_impact', p.x + d.x * 13, p.y + d.y * 13, 25).setTint(0xffcb80);
      fade(scene, muzzle, 95);
      if (!distance) return;
      const bullet = emit('fx_bolt', p.x + d.x * 10, p.y + d.y * 10, TILE * .85, TILE * .4).setOrigin(1, .5).setRotation(angle);
      scene.tweens.add({ targets: bullet, x: end.x, y: end.y, duration: 100, onComplete: () => bullet.destroy() });
    });
  } else if (type === 'lance') {
    const directions: Dir[] = ['up', 'down', 'left', 'right'];
    for (const direction of directions) {
      const vector = directionVector(direction);
      const line = tiles.filter(tile => vector.x ? tile.y === origin.y && Math.sign(tile.x-origin.x) === vector.x
        : tile.x === origin.x && Math.sign(tile.y-origin.y) === vector.y);
      const last = line[line.length - 1];
      if (!last) continue;
      const target = world(last), length = Math.hypot(target.x-p.x, target.y-p.y);
      const beam = emit('fx_beam', p.x, p.y, 1, TILE * .7).setOrigin(0, .5)
        .setRotation(Math.atan2(vector.y, vector.x)).setTint(0xb1f1ff);
      scene.tweens.add({ targets: beam, displayWidth: length, duration: 150, ease: 'Cubic.out' });
      fade(scene, beam, 220, 150);
    }
  } else {
    if (!distance) return;
    for (let shot = 0; shot < 3; shot++) scene.time.delayedCall(shot * 160, () => {
      const cross = emit('fx_skill_cross_v3', p.x, p.y, TILE).setRotation(angle);
      scene.tweens.add({ targets: cross, x: end.x, y: end.y, duration: 150,
        ease: 'Linear', onComplete: () => {
          scene.tweens.add({ targets: cross, displayWidth: TILE, displayHeight: TILE,
            alpha: 0, duration: 180, onComplete: () => cross.destroy() });
        } });
    });
    scene.cameras.main.shake(140, .001);
  }
}
