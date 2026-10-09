import type Phaser from 'phaser';
import { MONSTER_DEFS } from './data';
import { DIRECTIONAL_MONSTERS, directionArtForFloor } from './monsterDirections';
import { MONSTER_ANIMATIONS } from './monsterAnimation';
import optimizedPaths from './optimizedAssetPaths.json';
import { showLoading, updateLoading, finishLoading } from './loadingScreen';

type Entry = { kind: 'image' | 'spritesheet'; key: string; path: string; config?: Phaser.Types.Loader.FileTypes.ImageFrameConfig };
const manifest = new Map<string, Entry>();
const loaded = new Set<string>();
const assetUrl = (path: string) => (optimizedPaths as Record<string, string>)[path] ?? path;
export function assetManifest() { return [...manifest.values()]; }
let chain: Promise<void> = Promise.resolve();
const titleKeys = new Set(['title-menu-frame','title_citadel_v1','title_map_background','title_golden_crossed_swords',
  'ui_obsidian_panel','ui_obsidian_castle','ui_difficulty_hard','ui_difficulty_master']);

/** Record the existing manifest while keeping boot limited to the title. */
export function captureBootAssets(scene: Phaser.Scene): () => void {
  manifest.clear(); loaded.clear(); chain = Promise.resolve();
  const loader = scene.load;
  loader.maxParallelDownloads = 4;
  const image = loader.image.bind(loader), sheet = loader.spritesheet.bind(loader);
  const record = (entry: Entry) => {
    manifest.set(entry.key, entry);
    if (titleKeys.has(entry.key) || /player-painted-v1\/(male|female)-leather\./.test(entry.path)) {
      loader.once(`filecomplete-${entry.kind}-${entry.key}`, () => loaded.add(entry.key));
      if (entry.kind === 'image') image(entry.key, assetUrl(entry.path));
      else sheet(entry.key, assetUrl(entry.path), entry.config!);
    }
    return loader;
  };
  loader.image = ((key: string, path: string) => record({ kind: 'image', key, path })) as typeof loader.image;
  loader.spritesheet = ((key: string, path: string, config: Entry['config']) => record({ kind: 'spritesheet', key, path, config })) as typeof loader.spritesheet;
  return () => { loader.image = image; loader.spritesheet = sheet; scene.registry.set('assetManifest', [...manifest.values()]); };
}

function belongs(entry: Entry, floor: number, event: boolean, ending: boolean): boolean {
  if (ending) return entry.key === 'ending_dawn' || entry.key.startsWith('defeat_') || entry.key === 'quest_crest';
  if (entry.key === 'ending_dawn' || entry.key.startsWith('defeat_')) return false;
  // The codex can display every species, including previously discovered event enemies.
  // Load portraits and direction sheets on entry; keep terrain and effects streamed.
  if (MONSTER_DEFS.some(def => def.key === entry.key)
    || DIRECTIONAL_MONSTERS.some(art => art.textureKey === entry.key)) return true;
  if (/halloween|\/hw_|\/golden-/.test(entry.path) || entry.key.startsWith('hw_')) return event;
  const depth = entry.path.match(/(?:ruins-low-v1|water-v1|volcano-v1|thunder-v1|final-depths-v1)\/(\d+)\//)
    ?? entry.path.match(/ruins-floor-v1\/(\d+)\./);
  if (depth) return !event && Number(depth[1]) === floor;
  const direction = DIRECTIONAL_MONSTERS.find(art => art.textureKey === entry.key);
  // Early-floor bosses use monsters whose ordinary spawn floor is later.
  if (!event && direction && (entry.key === directionArtForFloor(floor, 'male').textureKey
    || entry.key === directionArtForFloor(floor, 'female').textureKey)) return true;
  const animation = MONSTER_ANIMATIONS.find(art => art.motionKey === entry.key || art.attackKey === entry.key);
  if (animation && DIRECTIONAL_MONSTERS.some(art => art.monsterKey === animation.monsterKey)) return false;
  const monster = MONSTER_DEFS.find(def => def.key === (direction?.monsterKey ?? animation?.monsterKey ?? entry.key));
  if (monster) return event ? monster.key.startsWith('m_hw_') : monster.minFloor <= floor;
  return true;
}

export function ensureSceneAssets(scene: Phaser.Scene, floor = 1, event = false, ending = false, loadingMode: 'entry' | 'stairs' = 'entry'): Promise<void> {
  const run = async () => {
    let remaining = [...manifest.values()].filter(entry => !loaded.has(entry.key) && belongs(entry, floor, event, ending));
    if (!remaining.length && loadingMode !== 'stairs') return;
    const total = remaining.length;
    showLoading(0, loadingMode === 'stairs' ? `第${floor}層へ続く階段を下りています…` : 'ダンジョンの画像を読み込み中…', loadingMode);
    const startedAt = performance.now();
    try {
      for (let attempt = 0; attempt < 3 && remaining.length; attempt++) {
        const failed = new Set<string>();
        await new Promise<void>(resolve => {
          const completions: { event: string; callback: () => void }[] = [];
          const error = (file: Phaser.Loader.File) => failed.add(file.key);
          const progress = (value: number) => updateLoading((total - remaining.length + remaining.length * value) / total,
            attempt ? '画像を再取得しています…' : 'ダンジョンの画像を読み込み中…');
          scene.load.maxParallelDownloads = 4;
          scene.load.on('loaderror', error); scene.load.on('progress', progress);
          scene.load.once('complete', () => {
            scene.load.off('loaderror', error); scene.load.off('progress', progress);
            for (const { event, callback } of completions) scene.load.off(event, callback);
            resolve();
          });
          for (const entry of remaining) {
            const temporary = `stream_${entry.key}`;
            const callback = () => {
              if (scene.textures.exists(entry.key)) scene.textures.remove(entry.key);
              scene.textures.renameTexture(temporary, entry.key); loaded.add(entry.key);
            };
            const event = `filecomplete-${entry.kind}-${temporary}`;
            completions.push({ event, callback }); scene.load.once(event, callback);
            if (entry.kind === 'image') scene.load.image(temporary, assetUrl(entry.path));
            else scene.load.spritesheet(temporary, assetUrl(entry.path), entry.config!);
          }
          scene.load.start();
        });
        remaining = remaining.filter(entry => failed.has(`stream_${entry.key}`));
      }
      if (remaining.length) console.warn('画像の取得を再試行しました。代替表示を使用:', remaining.map(e => e.key));
      const boot = scene.scene.get('BootScene') as Phaser.Scene & { prepareGameTextures?: () => void };
      if (!ending) boot.prepareGameTextures?.();
    } finally {
      if (loadingMode === 'stairs') {
        updateLoading(1, `第${floor}層に到着しました`);
        await new Promise(resolve => setTimeout(resolve, Math.max(0, 600 - (performance.now() - startedAt))));
      }
      finishLoading();
    }
  };
  chain = chain.then(run, run);
  return chain;
}
