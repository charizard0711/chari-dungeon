import type Phaser from 'phaser';

/** An interrupted animation still completes its turn; killTweensOf emits no stop event. */
export function awaitTween(
  scene: Phaser.Scene, target: Phaser.GameObjects.GameObject,
  props: Record<string, unknown>, duration: number, ease = 'Linear'
): Promise<void> {
  if (!target.active) return Promise.resolve();
  return new Promise((resolve) => {
    let tween: Phaser.Tweens.Tween | undefined;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      scene.events.off('postupdate', check);
      scene.events.off('shutdown', finish);
      target.off('destroy', finish);
      resolve();
    };
    const check = () => {
      if (!target.active || tween?.isDestroyed() || tween?.isRemoved()) finish();
    };
    tween = scene.tweens.add({ targets: target, ...props, duration, ease,
      onComplete: finish, onStop: finish });
    target.once('destroy', finish);
    scene.events.once('shutdown', finish);
    scene.events.on('postupdate', check);
  });
}
