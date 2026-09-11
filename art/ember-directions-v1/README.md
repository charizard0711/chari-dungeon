# エンバードラゴン：4方向の軽い表示

2026-09-11。1階の元絵 `public/assets/monsters/m_ember_drake.png` を参照し、built-in image_gen で方向違いの4枚を生成。

- 実行時画像: `public/assets/monsters/directional/ember-directions-v1.png`（256×256 RGBA、87,764 bytes）。128pxセルの2列×2行、下・左・右・上。
- 元の赤い鱗、金色の腹、角と翼、炎の尾、ドット絵の陰影を参照。上向きは背面。
- 全方向共通の縮小倍率でパッキング。足元はセルy=118、通常表示の原点と同じ0.5/0.6、artSize=120。
- 方向が変わったときだけ絵を切り替える。待機は上下±1.15px、左右±0.35px、傾き±1.45度。移動中の軽い浮き・傾きと攻撃時の3pxの前進を滑らかにつなぐ。体の拡大縮小はなし。
- 滑らかさの修正: ゲームカメラの整数ピクセル丸めを解除。移動・攻撃の加減速をSine.easeInOutにし、揺れを画像の表示原点に加えることで座標の上書きや移動終了時の位置の飛びを防ぐ。揺れの位相は行動中も連続。
- 移動116ms、近接の前進・戻り合計116ms（長押し時は既存の加速に追従）。遠距離は弾をすぐ出し、元の180msの飛行時間を維持。入力保持修正は維持。
- 2〜4階にも同じ4方向方式を追加（`art/floors-2-4-directions-v1/README.md`）。64コマの試作アニメーションは無効のまま。
- 確認: http://localhost:5173/qa/ember-directions.html
- ゲーム: http://localhost:5173/?qa-game&qa-floor=1&qa-field-arena
- 検証: `node scripts/qa-movement-input.mjs` / `npm run build`
- 実ブラウザーの1階でも20msの短押し2回（うち1回は処理中）を確認。2行動後に期待位置で停止、予約なし、計測時約189 FPS。
- 滑らかさの修正後も1階の実ブラウザーで2入力→2行動を確認（約177 FPS）。4方向画像の使用と座標の整数丸め無効を確認。画像の枚数・容量は変更なし。

## 元画像と再パッキング

生成元: `exec-d74a9c03-19f1-4153-866c-c27820caf7e0.png`。本体の絵柄は参照画像から新規作画。RGBAを保持してSharpでセルの抽出と縮小のみ実施。

`node scripts/prepare-monster-directions.cjs SOURCE public/assets/monsters/directional/ember-directions-v1.png`

## 使用プロンプト（built-in image_gen）

Use case: stylized-concept / game sprite turnaround.
Create ONE transparent sprite sheet containing exactly FOUR direction drawings of the SAME red dragon in the attached reference. The attached small original game illustration is the exact identity and style reference. Preserve the squat powerful silhouette, oversized horned head, curved charcoal-black swept-back horns and cheek spikes, layered dark crimson armor scales, luminous amber eyes, bright orange/gold segmented belly, small reddish bat wings with dark edges, thick clawed legs, long curled tail with a little orange flame. Match its hand-pixelled 1990s fantasy RPG sprite style: sharp stepped outlines, densely shaded red scale plates, jewel-like highlights, deep shadows, same cute but fierce body proportions. Do not redesign into a tall realistic dragon or smooth vector/cartoon illustration.
Composition: square image, strict 2 columns x 2 rows, equal square cells, generous fully transparent gutters. Each full dragon fits entirely within its cell with the same torso/head proportions and body size. One calm grounded standing pose per direction; wings half folded like reference, all paws close to body. Camera stays slightly elevated like the reference, not overhead. TOP LEFT = DOWN / facing viewer, front belly and symmetrical head visible. TOP RIGHT = LEFT / head and snout clearly pointing left, mostly left-facing three-quarter profile. BOTTOM LEFT = RIGHT / snout pointing right, mostly right-facing three-quarter profile. BOTTOM RIGHT = UP / facing away, genuine rear view: back of skull, rear horns, spine, backs of wings and tail, no eyes, no face, no golden front belly. Align feet to same height and bodies to center of each cell. Tail curves sideways at or above the feet. Exactly four standalone drawings; no additional action frames, no text, labels, grid lines, scenery, floor or shadows.
Background must be real empty PNG alpha transparency, never a painted checkerboard. Preserve crisp pixel art, not soft glow.
