// 画面レイアウト定義
// スマホなどタッチ端末を縦持ちで開いた場合は縦型レイアウトに切り替える。
// PC（横長ウィンドウ）は従来の 1280x760 のまま。
// URLに ?mobile=1 / ?mobile=0 を付けると強制切り替え（動作確認用）
const FORCE = new URLSearchParams(location.search).get('mobile');
export const IS_MOBILE =
  FORCE === '1' ? true :
  FORCE === '0' ? false :
  ((('ontouchstart' in window) || navigator.maxTouchPoints > 0) &&
    window.innerHeight > window.innerWidth);

export const GAME_W = IS_MOBILE ? 600 : 1280;
export const GAME_H = IS_MOBILE ? 1004 : 760;

// マップ表示ビューポート（画面上の座標）
export const MAP_X = IS_MOBILE ? 8 : 176;
export const MAP_Y = IS_MOBILE ? 168 : 48;
export const MAP_W = IS_MOBILE ? 420 : 740;
export const MAP_H = IS_MOBILE ? 418 : 520;
