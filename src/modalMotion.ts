import type Phaser from 'phaser';

/** Grow around the panel center while retaining the children's layout coordinates. */
export function openModalMotion(scene: Phaser.Scene, root: Phaser.GameObjects.Container, cx: number, cy: number) {
  scene.tweens.killTweensOf(root);
  root.setScale(.88).setPosition(cx * .12, cy * .12).setAlpha(.35);
  scene.tweens.add({targets:root,scaleX:1,scaleY:1,x:0,y:0,alpha:1,duration:240,ease:'Cubic.out'});
}

export function resetModalMotion(scene: Phaser.Scene, root: Phaser.GameObjects.Container) {
  scene.tweens.killTweensOf(root);
  root.setScale(1).setPosition(0,0).setAlpha(1);
}
