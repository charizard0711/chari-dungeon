import type Phaser from 'phaser';

let game: Phaser.Game | undefined;
const pending = new Set<string>();
const ready = new Set<string>();
export function configureLazyEquipmentArt(value: Phaser.Game) { game = value; pending.clear(); ready.clear(); }

/** Keep a readable placeholder while loading only the rare artwork being displayed. */
export function requestEquipmentArt(key: string): string {
  if (!game || !(key.startsWith('star_w_') || key.startsWith('sheath_star_'))) return key;
  if (ready.has(key) || pending.has(key)) return key;
  const base = key.replace('star_', '');
  if (!game.textures.exists(key) && game.textures.exists(base)) {
    game.textures.addImage(key, game.textures.get(base).getSourceImage() as HTMLImageElement);
  }
  const scene = game.scene.getScene('GameScene');
  if (!scene?.sys.isActive()) return key;
  pending.add(key);
  const temporary = `lazy_${key}`;
  const folder = key.startsWith('sheath_') ? 'katana-sheaths-v1' : 'star-weapons-v1';
  scene.load.image(temporary, `assets/${folder}/${key}.webp`);
  scene.load.once(`filecomplete-image-${temporary}`, () => {
    const images: Phaser.GameObjects.Image[] = [];
    const visit = (objects: Phaser.GameObjects.GameObject[]) => {
      for (const object of objects) {
        const image = object as Phaser.GameObjects.Image;
        if (image.texture?.key === key) images.push(image);
        const list = (object as Phaser.GameObjects.Container).list;
        if (Array.isArray(list)) visit(list);
      }
    };
    for (const active of game!.scene.getScenes(true)) visit(active.children.list);
    const replacements = images.map(image => ({ image, width: image.displayWidth, height: image.displayHeight }));
    game!.textures.remove(key);
    game!.textures.renameTexture(temporary, key);
    for (const { image, width, height } of replacements) {
      image.setTexture(key).setDisplaySize(width, height);
    }
    ready.add(key); pending.delete(key);
  });
  scene.load.start();
  return key;
}
