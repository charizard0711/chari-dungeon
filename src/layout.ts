// 画面レイアウト定義
// スマホなどタッチ端末を縦持ちで開いた場合は縦型レイアウトに切り替える。
// PC（横長ウィンドウ）は従来の 1280x760 のまま。
// URLに ?mobile=1 / ?mobile=0 を付けると強制切り替え（動作確認用）
const FORCE = new URLSearchParams(location.search).get('mobile');
const TOUCH_DEVICE = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const PHONE_SIZED = Math.min(window.innerWidth, window.innerHeight) <= 700;
export const IS_MOBILE =
  FORCE === '1' ? true :
  FORCE === '0' ? false :
  (window.innerWidth <= 520 || (TOUCH_DEVICE && PHONE_SIZED));

// 390×844前後のスマホでほぼ等倍になる論理解像度。
// 文字やタッチ領域がPC版の縮小表示にならないよう、専用サイズを使う。
export const GAME_W = IS_MOBILE ? 390 : 1280;
export const GAME_H = IS_MOBILE ? 844 : 760;

// マップ表示ビューポート（画面上の座標）
export const MAP_X = IS_MOBILE ? 8 : 176;
export const MAP_Y = IS_MOBILE ? 116 : 48;
export const MAP_W = IS_MOBILE ? 374 : 740;
export const MAP_H = IS_MOBILE ? 374 : 520;
