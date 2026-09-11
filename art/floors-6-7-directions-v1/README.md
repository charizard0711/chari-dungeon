# 6・7階ボスの4方向

2026-09-11。built-in image_gen で各ボスの元絵を参照して作画し、同じツールで背景を透過。1〜5階で採用した4枚固定の方向切り替えと、滑らかな揺れ・傾き・移動・攻撃を共用。

- 実行時は各256×256 RGBA、128pxセル×4。並びは下・左・右・上。
- 6階: `public/assets/monsters/directional/bone-directions-v1.png`（91,494 bytes）。骨の竜、青い胸の霊火、紫黒の翼を維持。
- 7階: `public/assets/monsters/directional/hydra-directions-v1.png`（80,054 bytes）。全方向3つの頭と3本の首。上は背面。元絵の青紫を維持し、ゲーム内は既存の翡翠色のtintを適用。
- 共通縮小倍率、足元y=118、描画用artSize=120。拡大縮小アニメーションや追加コマなし。
- Sharpは透過済み画像の抽出・縮小・パッキングにのみ使用。ゲーム処理は既存の共通実装を使用。
- モンスター種別で画像を共用するため、後半階で同種が登場する場合も新しい4方向を使用。

## 確認

- `node scripts/qa-movement-input.mjs`: PASS。7種×4方向のフレーム、待機・移動・攻撃のつながり、位置・サイズ保持、入力保持を確認。
- `npm run build`: PASS。
- `git diff --check`: PASS。
- 実ブラウザーの6・7階で、20msの短押し2回（うち1回は移動処理中）→2行動を両方確認。期待した位置と方向で停止し、入力予約なし。
- ボス画像がそれぞれ `bone_directions_v1` / `hydra_directions_v1`、座標の整数丸め無効を確認。テスト計測時は各約100 FPS（環境・計測時点依存）。
- 4方向の透明背景、角・翼・尾の欠けがないこと、ヒュドラの頭が全方向で3つあることをプレビューで確認。
- [6階プレビュー](http://localhost:5173/qa/ember-directions.html?floor=6) / [7階プレビュー](http://localhost:5173/qa/ember-directions.html?floor=7)
- [6階ゲーム](http://localhost:5173/?qa-game&qa-floor=6&qa-field-arena) / [7階ゲーム](http://localhost:5173/?qa-game&qa-floor=7&qa-field-arena)

## 再パッキング

`node scripts/prepare-monster-directions.cjs SOURCE public/assets/monsters/directional/NAME-directions-v1.png`

環境に合わせて `SHARP_MODULE` にSharpのパスを設定。

## 6階 ボーンワイバーン — built-in image_gen

参照元: `public/assets/monsters/m_bone_dragon.png`

- 元の4方向: [exec-81832122-acba-46f0-b912-f5e23b55febf.png](C:/Users/masam/.codex/generated_images/01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c/exec-81832122-acba-46f0-b912-f5e23b55febf.png)
- 採用した透過画像: [exec-1cc0c99c-6098-4f24-ab44-c445e22fb1e0.png](C:/Users/masam/.codex/generated_images/01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c/exec-1cc0c99c-6098-4f24-ab44-c445e22fb1e0.png)

### 作画プロンプト

Use case: stylized-concept, game sprite turnaround. Make ONE square sprite sheet with exactly FOUR complete directional drawings of the creature in the attached ORIGINAL game sprite. The attachment is the exact identity and pixel-art style reference. Keep its rich old-school fantasy RPG shading, crisp stepped outlines, anatomy, distinctive details and colors. This is a turnaround, not an action animation or redesign.
Strict 2 columns x 2 rows, SAME body scale in every cell. TOP LEFT = DOWN/front toward the viewer. TOP RIGHT = LEFT/profile facing left. BOTTOM LEFT = RIGHT/profile facing right. BOTTOM RIGHT = UP/true BACK VIEW facing away, backs of heads and spine visible, NO front-facing faces or eyes. Every head must face that cell's direction. One calm standing/resting pose per direction, full creature including ALL horns, tails, feet and wings (if any) within its own cell. Leave a generous empty transparent margin on EVERY edge of each cell and around the central row/column boundaries, at least 10% per edge. Center body and align feet/coil at same baseline. No attack effects, breath, text, captions, grid lines, scene, floor or cast shadows. Background must be REAL empty transparent PNG alpha, never an illustration of a checkerboard.
Creature identity: a true SKELETAL BONE DRAGON made of aged ivory/cream bones and dark brown bone shadows, a long horned DRAGON SKULL with hollow eye socket glowing cyan, sharp ivory teeth, multiple swept bony horns, exposed separate rib bones around a brilliant cyan-blue spectral flame INSIDE its hollow rib cage, bony spine, skeletal clawed legs with separated bone joints, long segmented skeleton tail curled to the side. TWO bat-like wings use thin ivory bone struts and ragged dark plum/purple-black membranes, half-folded like the reference. All torso ribs and gaps must stay legible. This is an undead skeleton, NOT a brass mechanical dragon, NO gears, NO metal plating, NO clockwork parts, NO fleshy scales. No extra heads. Show the skull's back, bony vertebrae and rear wing surfaces on the UP view. Preserve the original compact crouching, winged skeletal dragon silhouette.

### 透過プロンプト

Extract all 4 skeletal bone dragon sprites and remove the entire gray and white checkerboard background. Output the sprites on a transparent background. Keep every creature exactly as drawn, in the same positions. The PNG must have actual transparent alpha, NOT an image of checkerboard squares.

## 7階 ジェイドヒュドラ — built-in image_gen

参照元: `public/assets/monsters/m_hydra.png`

- 元の4方向: [exec-cde69324-c34e-4af1-9962-9785dfb3cd5c.png](C:/Users/masam/.codex/generated_images/01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c/exec-cde69324-c34e-4af1-9962-9785dfb3cd5c.png)
- 採用した透過画像: [exec-7b6922fc-5f1d-4499-9a2c-31aff2e97b1d.png](C:/Users/masam/.codex/generated_images/01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c/exec-7b6922fc-5f1d-4499-9a2c-31aff2e97b1d.png)

### 作画プロンプト

Use case: stylized-concept, game sprite turnaround. Make ONE square sprite sheet with exactly FOUR complete directional drawings of the creature in the attached ORIGINAL game sprite. The attachment is the exact identity and pixel-art style reference. Keep its rich old-school fantasy RPG shading, crisp stepped outlines, anatomy, distinctive details and colors. This is a turnaround, not an action animation or redesign.
Strict 2 columns x 2 rows, SAME body scale in every cell. TOP LEFT = DOWN/front toward the viewer. TOP RIGHT = LEFT/profile facing left. BOTTOM LEFT = RIGHT/profile facing right. BOTTOM RIGHT = UP/true BACK VIEW facing away, backs of heads and spine visible, NO front-facing faces or eyes. Every head must face that cell's direction. One calm standing/resting pose per direction, full creature including ALL horns, tails, feet and wings (if any) within its own cell. Leave a generous empty transparent margin on EVERY edge of each cell and around the central row/column boundaries, at least 10% per edge. Center body and align feet/coil at same baseline. No attack effects, breath, text, captions, grid lines, scene, floor or cast shadows. Background must be REAL empty transparent PNG alpha, never an illustration of a checkerboard.
Creature identity: a THREE-HEADED HYDRA with exactly THREE distinct dragon heads on exactly THREE long separate necks, all attached to ONE stocky dragon body. Preserve the reference's sapphire/cobalt blue scales with violet shadow tones, tall cyan-blue crystalline spine crests on every head and neck, pale slate-grey segmented underside plates, small bright violet/cyan eyes, strong clawed legs and heavy curled spiked tail. Central neck is tallest, two side necks somewhat lower and spread, so all three heads are separately readable even in side view (stagger their heights and depths, do NOT merge them). NO WINGS. Calm jaws mostly closed, no breath effects. Each of the FOUR cells must have EXACTLY THREE heads and three necks, not one, two, four or more. ALL THREE heads point in the specified direction for that cell. For UP, show three rear skulls/crest backs and the spiny back, no eyes or front snouts peeking at the viewer. Keep the three-head silhouette recognizable in a tiny dungeon game. Preserve the source's blue/purple palette; game tint supplies the jade color later.

### 透過プロンプト

Extract all 4 three-headed blue hydra sprites and remove the entire gray and white checkerboard background. Output the sprites on a transparent background. Keep every creature exactly as drawn, in the same positions. The PNG must have actual transparent alpha, NOT an image of checkerboard squares.
