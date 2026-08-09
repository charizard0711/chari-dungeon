import Phaser from 'phaser';
import { buildAllTextures } from '../textures';
import { applyRealAssets } from '../assetLoader';
import { BGM_DEFS, SE_DEFS, AudioDef } from '../audio/config';
import { Audio } from '../audio/manager';

const EXPANSION_MONSTER_KEYS = [
  'm_ember_drake', 'm_frost_wyrm', 'm_storm_wyvern', 'm_brass_dragon', 'm_void_drake', 'm_bone_dragon',
  'm_horn_demon', 'm_chain_demon', 'm_flame_gargoyle', 'm_abyss_hound', 'm_mask_fiend', 'm_archdemon',
  'm_bone_hound', 'm_skeleton_mage', 'm_death_knight', 'm_lich', 'm_bone_colossus', 'm_grave_crawler',
  'm_cerberus', 'm_hydra', 'm_crystal_crab', 'm_blood_moth', 'm_clockwork_chimera'
] as const;

const WEAPON_ART = {
  w_dagger_fire: 'assets/weapons/affinities/dagger_fire.png',
  w_dagger_water: 'assets/weapons/affinities/dagger_water.png',
  w_dagger_thunder: 'assets/weapons/affinities/dagger_thunder.png',
  w_dagger_ice: 'assets/weapons/affinities/dagger_ice.png',
  w_longsword_fire: 'assets/weapons/affinities/longsword_fire.png',
  w_longsword_water: 'assets/weapons/affinities/longsword_water.png',
  w_longsword_thunder: 'assets/weapons/affinities/longsword_thunder.png',
  w_longsword_ice: 'assets/weapons/affinities/longsword_ice.png',
  w_bow_fire: 'assets/weapons/affinities/bow_fire.png',
  w_bow_water: 'assets/weapons/affinities/bow_water.png',
  w_bow_thunder: 'assets/weapons/affinities/bow_thunder.png',
  w_bow_ice: 'assets/weapons/affinities/bow_ice.png',
  w_dual_sword_fire: 'assets/weapons/affinities/dual_sword_fire.png',
  w_dual_sword_water: 'assets/weapons/affinities/dual_sword_water.png',
  w_dual_sword_thunder: 'assets/weapons/affinities/dual_sword_thunder.png',
  w_dual_sword_ice: 'assets/weapons/affinities/dual_sword_ice.png',
  w_iron_dagger: 'assets/weapons/neutral/iron_dagger.png',
  w_knight_sword: 'assets/weapons/neutral/knight_sword.png',
  w_bone_lance: 'assets/weapons/neutral/bone_lance.png',
  w_royal_bow: 'assets/weapons/neutral/royal_bow.png',
  w_grand_breaker: 'assets/weapons/neutral/grand_breaker.png'
} as const;

const SHIELD_ART = {
  s_iron_round: 'assets/shields/neutral/iron_round.png',
  s_mirror_silver: 'assets/shields/neutral/mirror_silver.png',
  s_thorn_guard: 'assets/shields/neutral/thorn_guard.png',
  s_chrono_guard: 'assets/shields/neutral/chrono_guard.png',
  s_seraph_guard: 'assets/shields/neutral/seraph_guard.png',
  s_flame_aegis: 'assets/shields/elemental/flame_aegis.png',
  s_tidal_aegis: 'assets/shields/elemental/tidal_aegis.png',
  s_storm_aegis: 'assets/shields/elemental/storm_aegis.png',
  s_frost_aegis: 'assets/shields/elemental/frost_aegis.png'
} as const;

const ORIGINAL_ITEM_ART = {
  i_stone: 'assets/items/weapon-enhancement-scroll.png',
  i_shieldstone: 'assets/items/armor-enhancement-scroll.png',
  i_invis: 'assets/items/invisibility-potion.png',
  i_dash: 'assets/items/gale-feather.png'
} as const;

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // アセットシート（public/assets/）を読み込む
    this.load.image('sheet_characters', 'assets/characters.png');
    this.load.image('sheet_monsters', 'assets/monsters.png');
    this.load.image('sheet_items', 'assets/items.png');
    this.load.image('sheet_tiles', 'assets/tiles.png');
    this.load.image('dungeon_chamber', 'assets/dungeon-chamber.png');
    this.load.image('title_screen_v2', 'assets/title-screen-v2.png');
    for (const [key, path] of Object.entries(ORIGINAL_ITEM_ART)) {
      this.load.image(key, path);
    }
    for (const [key, path] of Object.entries(WEAPON_ART)) {
      this.load.image(key, path);
    }
    for (const [key, path] of Object.entries(SHIELD_ART)) {
      this.load.image(key, path);
    }
    for (const key of EXPANSION_MONSTER_KEYS) {
      this.load.image(key, `assets/monsters/${key}.png`);
    }

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn('アセット読み込み失敗:', file.key);
    });
  }

  async create() {
    // 1) 代替ドット絵テクスチャを手続き生成（フォールバック）
    buildAllTextures(this);
    // 2) アセットシートから実画像を切り抜いて上書き
    const result = applyRealAssets(this);
    console.log(`アセット切り抜き: ${result.applied}個適用`, result.skipped.length ? `スキップ: ${result.skipped.join(',')}` : '');

    // 3) 実在する音源ファイルだけを読み込む
    //    （Viteは存在しないパスにindex.htmlを返すため、content-typeで実在判定する。
    //     実ファイルが無い音は manager 側で仮チップチューンが合成される）
    const allAudio: AudioDef[] = [...Object.values(BGM_DEFS), ...Object.values(SE_DEFS)];
    const existing = await this.filterExistingAudio(allAudio);
    if (existing.length > 0) {
      await this.loadAudioFiles(existing);
      console.log(`音源ファイル読み込み: ${existing.length}個（残りは合成音で代替）`);
    } else {
      console.log('音源ファイルは未配置。内蔵のチップチューンで再生します。');
    }

    // 4) オーディオ初期化（効果音は先に合成してキャッシュ）
    Audio.init(this.game);
    Audio.preloadSynthSe();

    this.scene.start('TitleScene');
  }

  // content-typeが音声のものだけ返す
  private async filterExistingAudio(defs: AudioDef[]): Promise<AudioDef[]> {
    const results = await Promise.all(defs.map(async (def) => {
      try {
        // 大きなBGMを存在確認だけで二重ダウンロードしない。
        const res = await fetch(def.path, { method: 'HEAD' });
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.startsWith('audio')) return def;
      } catch {
        /* ネットワークエラー等は「無い」扱い */
      }
      return null;
    }));
    return results.filter((d): d is AudioDef => d !== null);
  }

  // 実在音源をPhaserローダーで読み込む（完了を待つ）
  private loadAudioFiles(defs: AudioDef[]): Promise<void> {
    return new Promise((resolve) => {
      for (const def of defs) this.load.audio(def.key, def.path);
      this.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
      this.load.start();
    });
  }
}
