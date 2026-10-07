import type Phaser from 'phaser';

/** Grow around the panel center while retaining the children's layout coordinates. */
export function openModalMotion(scene: Phaser.Scene, root: Phaser.GameObjects.Container, cx: number, cy: number) {
  resetModalMotion(scene, root);
  // The first child is the full-screen dimmer. It stays fixed and dark immediately.
  const children = root.list.slice(1).map(child => {
    const item = child as Phaser.GameObjects.Image;
    return {item,x:item.x,y:item.y,sx:item.scaleX,sy:item.scaleY,alpha:item.alpha};
  });
  const apply = (amount: number) => {
    for (const {item,x,y,sx,sy,alpha} of children) {
      if (!item.active) continue;
      item.setPosition(cx+(x-cx)*amount,cy+(y-cy)*amount).setScale(sx*amount,sy*amount)
        .setAlpha(alpha*(.35+.65*(amount-.88)/.12));
    }
  };
  apply(.88);
  const tween = scene.tweens.addCounter({from:.88,to:1,duration:240,ease:'Cubic.out',
    onUpdate:animation=>apply(animation.getValue() ?? 1),onComplete:()=>apply(1)});
  root.setData('modal-motion',tween);
}

export function resetModalMotion(scene: Phaser.Scene, root: Phaser.GameObjects.Container) {
  scene.tweens.killTweensOf(root);
  (root.getData('modal-motion') as Phaser.Tweens.Tween | undefined)?.stop();
  root.setScale(1).setPosition(0,0).setAlpha(1);
}
