import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { EndScene } from './scenes/EndScene';

export const GAME_W = 1280;
export const GAME_H = 760;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  parent: 'game-container',
  backgroundColor: '#0b0e14',
  // 元のアセット画像に近づけるため、ドット絵の強制拡大(NEAREST)はやめて
  // スムーズ表示(アンチエイリアス)にする
  pixelArt: false,
  antialias: true,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, TitleScene, GameScene, UIScene, EndScene]
};

const game = new Phaser.Game(config);
// デバッグ用に公開
(window as any).__game = game;
