# 16〜20F 火山アセット

承認済み `../volcano-concepts-floors16-20-v1/` をゲームに適用した素材。
すべて built-in `image_gen` で描画。プロンプト、参照画像、生成元は `prompts.json` に記録。
各 `boss-*.png`、`floors-*.png`、`props-*.png`、`lava.png` が採用原画。

- 16F 熔翼の堕天使：低い黒曜岩、翼像、噴気口、火鉢。
- 17F 火口のフェニックス：縄状溶岩の床、火の卵と巣、低い岩柱。
- 18F 熔角獣イグニコーン：岩盤の床、黒曜石、熔岩鉢、炭化木、角の祭壇。
- 19F 灰燼の大鎌使い：灰の石床、肋骨の残骸、壺、墓標、熔岩の祭壇。
- 20F 熔獄竜ヴァルグラド：赤黒い四足の巨竜、熔岩に囲まれた八角形の足場、炉柱・金床・歯車・岩の祭壇。

`scripts/prepare-volcano-assets.cjs` は生成済みのアルファを保持して切り出し・縮小・アトラス化する。
ボスは4方向×128px（256×256のシート）。床は4種類×64px、壁64px、置物128px。
ゲーム起動時に壁と背景を一度だけ重ね、各マスを1枚のスプライトで描く。床・壁・置物に追加アニメーションはない。

ゲーム用ファイルは `public/assets/monsters/directional/*volcano-v1.png`、
`public/assets/monsters/directional/valgrado-directions-v1.png`、
`public/assets/terrain/volcano-v1/`。

20F専用ボス撃破では、20Fまでに出現する火属性の短剣・長剣・弓・銃から均等に1本を確定ドロップする。
15Fの氷晶王・氷の部屋・氷武器の確定報酬は維持。

確認ページ：`/qa/volcano-update.html`、`/qa/boss-swap-reward.html`、`/qa/input-response.html`（localhost専用）。

## 確認済み

- `npm run build`：TypeScriptと本番ビルド成功。
- `qa-custom-floor-bosses.cjs`：ボスの出現・属性・方向画像、氷/火山部屋の全床への到達、壁で止まる火のブレス、置物で優先転移先が塞がった場合の代替先。
- `qa-glacial-boss-reward.cjs`：氷100回、火100回の討伐で各1本、4種類すべて抽選可能、重複報酬なし、出口開放。
- `qa-frost-decor.cjs`：全30階計750マップの通行と配置を確認。
- `qa-movement-input.mjs`：短押しの予約・リピート・解放、連続モーション、固定サイズ、攻撃完了待ち。
- ブラウザー：16〜20Fの予告から火属性攻撃まで、19Fの上下左右のフレーム切替、20Fの実撃破で火属性武器1本と出口開放。
- ブラウザー：1/16/20Fで20msの短押し2回が2行動になり、予約・処理中状態が解消。確認時は117〜119FPS。

ローカル実装。今回の変更は公開リリースしていない。
