# 封印王アウレリウス：5階ボスの4方向

2026-09-11。built-in image_gen で元絵 `public/assets/monsters/m_archdemon.png` を参照して4方向を描画。同じツールで背景を透過。

- 実行時画像: `public/assets/monsters/directional/aurelius-directions-v1.png`（256×256 RGBA、89,012 bytes）。128pxセル×4枚。下・左・右・上。
- 大きく曲がった角、赤い翼、黒金の鎧、前面の胸の炎を維持。上向きは胸の炎が見えない背面。
- 1〜4階と同じ滑らかな揺れ・傾き・加減速を共用。絵の追加コマ、体の拡大縮小なし。短押し保持も維持。
- 固定サイズは5階ボス既存倍率1.72を維持。描画用artSize=120、4方向共通縮小倍率、足元y=118。
- 翼が元シートの中央線を越えていたため、RGBAの連結領域から4体を抽出。翼を欠かさずパッキング。Sharpは抽出と共通倍率での縮小のみ。
- 通常の5階フィールドには強ボスが出ないため、確認は専用ボス部屋を使用。広い専用部屋では部屋中央でなく実際のボスの近くへ表示（localhostのQA時のみ）: http://localhost:5173/?qa-game&qa-floor=5&qa-boss&qa-field-arena
- 方向一覧: http://localhost:5173/qa/ember-directions.html?floor=5
- 検証: `node scripts/qa-movement-input.mjs` / `npm run build` / 実ブラウザーの専用ボス部屋
- 実ブラウザーの5階ボス部屋で20msの短押し2回（うち1回は処理中）→2行動を確認。期待位置で停止し、予約なし。新画像・左向き・整数丸め無効を確認。計測時約185 FPS。

## 生成ファイル

- 元の4方向: `exec-74c037b8-a1cd-4306-bba6-51f25d1a9312.png`
- 採用した透過画像: `exec-d6c406b0-e5a6-4c10-bf52-56d7028ef12e.png`
- 再パッキング: `node scripts/prepare-monster-directions.cjs SOURCE public/assets/monsters/directional/aurelius-directions-v1.png`

## 作画プロンプト（built-in image_gen）

Use case: stylized-concept, game sprite turnaround. Create ONE square sprite sheet with exactly FOUR directional drawings of the SAME armored archdemon king in the attached ORIGINAL game sprite reference. Match its sharp hand-pixelled fantasy RPG illustration style, dense dark armor shading, warm rim highlights and compact powerful proportions. This is a direction turnaround, not an action animation and not a redesign.
Identity to preserve: a BIPEDAL HUMANOID DEMON KING with TWO muscular armored arms, TWO digitigrade armored legs and clawed feet, massive curling black ram horns, a menacing helmet-like dark face with fiery orange eyes, black-red layered spiky plate armor edged in antique gold/brass, an intense orange molten furnace glow in the FRONT chest and abdomen, clawed hands with red-hot details, and TWO great red bat wings edged in black. It has no dragon snout, no extra legs, no weapons and no cape. Preserve the original broad chest, spiked shoulders, intricate armor, curled horns, dark crimson wing membranes and infernal orange highlights. The wings are calmly half spread with slightly folded tips, exactly like the original silhouette.
Square 2 columns x 2 rows. Exactly 4 complete separate drawings at the SAME body scale. TOP LEFT = DOWN/front facing the viewer, fiery front chest visible. TOP RIGHT = LEFT, head/face and torso facing left in clear profile/three-quarter view. BOTTOM LEFT = RIGHT, face and torso facing right. BOTTOM RIGHT = UP/true BACK VIEW facing away: back of horned head, rear armor and backs of wings visible; no eyes, face or front chest furnace on its back. Keep both feet aligned at the same baseline and body centered in each equal square cell. Entire horns, claws, feet and wings must stay inside the cell with generous transparent gutters, at least 8% empty margin on EVERY edge. One calm standing pose per direction. No flame jets or attack effects, no scenery, cast shadows, background glow, text, labels or grid lines.
Background must be actual empty transparent PNG alpha, NEVER painted checkerboard squares. Maintain crisp pixel art that will read in a small dungeon game.

## 透過プロンプト（built-in image_gen）

Extract all 4 armored red-and-black demon king sprites and remove the entire gray and white checkerboard background. Output the sprites on a transparent background. Keep every demon exactly as drawn, in the same positions. The PNG must have actual transparent alpha, NOT an image of checkerboard squares.
