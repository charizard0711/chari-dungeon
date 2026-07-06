// ========================================================================
// オーディオマネージャー
// - BGMと効果音(システム音)の音量・ミュートを別々に管理
// - 本物の音源ファイルが読み込めていればそれを、無ければ仮チップチューンを使用
// - Phaser の sound マネージャー(ゲーム全体で共有)経由で再生
// ========================================================================
import Phaser from 'phaser';
import { BGM_DEFS, SE_DEFS, BgmName, SeName } from './config';
import { renderBgm, renderSe } from './synth';

class AudioManagerImpl {
  private game: Phaser.Game | null = null;
  private currentBgm: Phaser.Sound.BaseSound | null = null;
  private currentName: BgmName | null = null;

  bgmVolume = 0.2;  // 初期音量20%
  seVolume = 0.2;   // 初期音量20%
  bgmOn = true;
  seOn = true;

  init(game: Phaser.Game) {
    if (this.game) return;
    this.game = game;
    // ブラウザの自動再生制限：最初のクリック/キー入力で解除されたら
    // 再生中のはずのBGMをかけ直す
    const sm = game.sound;
    if ((sm as any).locked) {
      sm.once(Phaser.Sound.Events.UNLOCKED, () => {
        const name = this.currentName;
        this.currentName = null;
        this.stopBgmSound();
        if (name) this.playBgm(name);
      });
    }
  }

  // 全効果音を先に合成してキャッシュしておく（初回再生の遅延防止）
  preloadSynthSe() {
    for (const name of Object.keys(SE_DEFS) as SeName[]) {
      void this.ensure(SE_DEFS[name].key, () => renderSe(name));
    }
  }

  // キャッシュに無ければ仮音源を合成して登録
  private async ensure(key: string, make: () => Promise<AudioBuffer>): Promise<boolean> {
    if (!this.game) return false;
    if (this.game.cache.audio.exists(key)) return true;
    try {
      const buf = await make();
      // 非同期中に他所で登録済みになっていたら二重登録しない
      if (!this.game.cache.audio.exists(key)) this.game.cache.audio.add(key, buf);
      return true;
    } catch (e) {
      console.warn('音源生成に失敗:', key, e);
      return false;
    }
  }

  async playBgm(name: BgmName) {
    if (!this.game) return;
    if (this.currentName === name && this.currentBgm?.isPlaying) return;
    const def = BGM_DEFS[name];
    this.currentName = name;
    const ok = await this.ensure(def.key, () => renderBgm(name));
    // 生成待ちの間に別のBGMへ切り替わっていたら何もしない
    if (!ok || this.currentName !== name) return;
    this.stopBgmSound();
    const snd = this.game.sound.add(def.key, {
      loop: def.loop ?? true,
      volume: this.bgmOn ? def.volume * this.bgmVolume : 0
    });
    this.currentBgm = snd;
    snd.play();
  }

  stopBgm() {
    this.currentName = null;
    this.stopBgmSound();
  }

  private stopBgmSound() {
    if (this.currentBgm) {
      this.currentBgm.stop();
      this.currentBgm.destroy();
      this.currentBgm = null;
    }
  }

  async playSe(name: SeName) {
    if (!this.game || !this.seOn) return;
    const def = SE_DEFS[name];
    const ok = await this.ensure(def.key, () => renderSe(name));
    if (ok) this.game.sound.play(def.key, { volume: def.volume * this.seVolume });
  }

  // ---- 音量・ミュート操作（設定画面から呼ばれる）----
  setBgmVolume(v: number) {
    this.bgmVolume = Phaser.Math.Clamp(v, 0, 1);
    this.applyBgmVolume();
  }

  setSeVolume(v: number) {
    this.seVolume = Phaser.Math.Clamp(v, 0, 1);
  }

  toggleBgm() {
    this.bgmOn = !this.bgmOn;
    this.applyBgmVolume();
  }

  toggleSe() {
    this.seOn = !this.seOn;
  }

  private applyBgmVolume() {
    if (this.currentBgm && this.currentName) {
      const def = BGM_DEFS[this.currentName];
      (this.currentBgm as Phaser.Sound.WebAudioSound).setVolume(
        this.bgmOn ? def.volume * this.bgmVolume : 0
      );
    }
  }
}

// シングルトン
export const Audio = new AudioManagerImpl();
