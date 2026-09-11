# 2〜4階のボス：4方向と滑らかな動き

2026-09-11。built-in image_gen で各ボスの元絵を参照して4方向を描画し、同じツールで背景を透過。Sharpは生成済みRGBAの抽出・共通倍率でのパッキングだけに使用。

1階で確認した表示処理を共用。各種128pxセル×4枚を256×256のRGBA画像に収め、方向変更時だけ絵を切り替える。表示原点による小さな揺れと傾き、Sine.easeInOutの移動・攻撃を継続。拡大縮小やコマ追加はなし。

- 2階: `public/assets/monsters/directional/frost-directions-v1.png`（88,484 bytes）
- 3階: `public/assets/monsters/directional/storm-directions-v1.png`（63,745 bytes）
- 4階: `public/assets/monsters/directional/brass-directions-v1.png`（101,060 bytes）
- 全種: 共通倍率でパッキング。足元y=118、原点0.5/0.6、artSize=120。
- 確認画面: http://localhost:5173/qa/ember-directions.html?floor=4 （上部で1〜4階を切り替え）
- 検証: `node scripts/qa-movement-input.mjs` / `npm run build` / 各階の実ブラウザー入力チェック
- 実ブラウザーでも2・3・4階すべてで、20msの短押し2回（うち1回は移動処理中）が2行動になり、期待位置で停止。各階の専用画像と整数丸め無効を確認。観測FPSは順に178 / 186 / 181。

## 元絵・生成ファイル・プロンプト

### 2階 フロストワイバーン

参照元: `public/assets/monsters/m_frost_wyrm.png`。生成: `exec-4410e841-a9aa-4085-b4c7-de53b9568691.png`。採用した透過画像: `exec-db03f390-5149-4b74-84fa-0acb5c4ed843.png`。

Use case: stylized-concept, game sprite turnaround. Create ONE square sprite sheet with exactly FOUR direction drawings of the SAME creature as the attached ORIGINAL game sprite reference. Match that reference's pixel-art touch, proportions, detailed stepped outlines, rich jewel-like shading and dark edges. This is a direction turnaround, not an animation sequence or redesign.
Strict 2 columns x 2 rows, generous fully transparent gutters, full creature including horns, wings and tail entirely within each square cell. Equal body scale and grounded/hover anchor in all directions. TOP LEFT=DOWN, front toward viewer. TOP RIGHT=LEFT, snout aimed clearly left in mostly side view. BOTTOM LEFT=RIGHT, snout aimed clearly right in mostly side view. BOTTOM RIGHT=UP, true rear view facing away: back of skull, spine and rear surfaces, absolutely no front face or eyes visible. Keep all heads/tails/feet the same proportions. Align body centers and bottom feet/coil at the same height within each cell. One calm resting pose per direction; no attack effects. No captions, labels, text, grid lines, scenery, floor or cast shadows. The background must be REAL TRANSPARENT PNG ALPHA, never a painted checkerboard. Keep at least 8% empty gutter on every edge of every cell. Sharp pixel art appropriate for a small fantasy dungeon RPG sprite.
Identity constraints: The reference is a sapphire-blue ICE WYRM with a long thick COILED SERPENTINE BODY, a raised angular dragon head, icy-white plated throat/belly, two small clawed forearms, large jagged crystalline blue/white ice spikes swept backward from skull and spine, yellow amber eye, long pointed ice-crystal tail curled around the base. Preserve the distinctive upright S-curve neck and circular coiled lower body. It has NO bat wings and NO hind legs. All four views must remain the same coiled ice serpent, never a conventional four-legged dragon. Preserve the blue crystalline pixel highlights and silver-white scales. Draw mouth calmly closed with no emitted frost breath. Up shows the spiky blue back and back of head, not the white throat.


### 3階 ストームドラゴン

参照元: `public/assets/monsters/m_storm_wyvern.png`。生成: `exec-3606727e-b45f-41a7-94fa-921d1d0b42d7.png`。採用した透過画像: `exec-e9a11560-d4bf-41da-808b-9c1dda407897.png`。

Use case: stylized-concept, game sprite turnaround. Create ONE square sprite sheet with exactly FOUR direction drawings of the SAME creature as the attached ORIGINAL game sprite reference. Match that reference's pixel-art touch, proportions, detailed stepped outlines, rich jewel-like shading and dark edges. This is a direction turnaround, not an animation sequence or redesign.
Strict 2 columns x 2 rows, generous fully transparent gutters, full creature including horns, wings and tail entirely within each square cell. Equal body scale and grounded/hover anchor in all directions. TOP LEFT=DOWN, front toward viewer. TOP RIGHT=LEFT, snout aimed clearly left in mostly side view. BOTTOM LEFT=RIGHT, snout aimed clearly right in mostly side view. BOTTOM RIGHT=UP, true rear view facing away: back of skull, spine and rear surfaces, absolutely no front face or eyes visible. Keep all heads/tails/feet the same proportions. Align body centers and bottom feet/coil at the same height within each cell. One calm resting pose per direction; no attack effects. No captions, labels, text, grid lines, scenery, floor or cast shadows. The background must be REAL TRANSPARENT PNG ALPHA, never a painted checkerboard. Keep at least 8% empty gutter on every edge of every cell. Sharp pixel art appropriate for a small fantasy dungeon RPG sprite.
Identity constraints: The reference is a dark navy/slate-blue STORM WYVERN with TWO large bat-wing arms, TWO clawed hind legs, thin long curled tail, swept horns and amber eyes. Rich bright electric-cyan branching lightning veins run INSIDE its dark bat wing membranes. Keep its lean airborne silhouette, armored slate-blue neck, gold/bronze horn ridges, hooked talons and long pointed tail. Both wings are half-raised in a relaxed hover, elbows bent enough to fit generous cell gutters. It is a TWO-LEGGED winged wyvern, never a stocky four-legged dragon or a coiled wingless serpent. Electricity remains a wing pattern, no large emitted bolts. Up clearly shows rear of head, spine and back surfaces of wings with no eyes or front chest.


### 4階 ブラスドレイク

参照元: `public/assets/monsters/m_brass_dragon.png`。生成: `exec-59f1ef27-5fb1-41b8-9653-1c0f3b0d0366.png`。採用した透過画像: `exec-05af5504-9469-4369-9b82-ace96fa45d47.png`。

Use case: stylized-concept, game sprite turnaround. Create ONE square sprite sheet with exactly FOUR direction drawings of the SAME creature as the attached ORIGINAL game sprite reference. Match that reference's pixel-art touch, proportions, detailed stepped outlines, rich jewel-like shading and dark edges. This is a direction turnaround, not an animation sequence or redesign.
Strict 2 columns x 2 rows, generous fully transparent gutters, full creature including horns, wings and tail entirely within each square cell. Equal body scale and grounded/hover anchor in all directions. TOP LEFT=DOWN, front toward viewer. TOP RIGHT=LEFT, snout aimed clearly left in mostly side view. BOTTOM LEFT=RIGHT, snout aimed clearly right in mostly side view. BOTTOM RIGHT=UP, true rear view facing away: back of skull, spine and rear surfaces, absolutely no front face or eyes visible. Keep all heads/tails/feet the same proportions. Align body centers and bottom feet/coil at the same height within each cell. One calm resting pose per direction; no attack effects. No captions, labels, text, grid lines, scenery, floor or cast shadows. The background must be REAL TRANSPARENT PNG ALPHA, never a painted checkerboard. Keep at least 8% empty gutter on every edge of every cell. Sharp pixel art appropriate for a small fantasy dungeon RPG sprite.
Identity constraints: The reference is a BRASS CLOCKWORK DRAGON with four mechanical clawed legs, layered antique-gold/brass armor plates, exposed little gears and rivets, segmented armored tail curled to the side, swept brass horns, cyan glowing eyes and a bright round cyan-blue reactor set into the front chest. It has two mechanical bat wings with brass struts and deep teal-blue membranes. Match the compact crouching mechanical dragon shape, metallic gold highlights, dark brown gear recesses, turquoise/cyan accents, and precise old-school hand-pixelled fantasy RPG shading. It is a clockwork dragon, not a bone skeleton, not a smooth robot toy. Wings half folded. Mouth calm, no breath attack. All four views share identical brass scale-plates, gear joints and cyan glowing details. Up is a true rear view with back armor, dorsal machinery and rear of skull; the front chest reactor must NOT appear on its back. Keep full tail inside each cell.

## 背景透過プロンプト

Use case: background-extraction. Remove the entire gray-and-white checkerboard background from this four-creature sprite sheet and make it actually transparent. Keep all FOUR dragon drawings exactly as they are, at precisely the same positions, same dimensions, colors and details. Preserve interior gaps between horns, wings, coils, legs and tails as transparent too. Output a PNG with REAL alpha transparency, not painted squares. Do not repaint, restyle, crop, rearrange or add anything.

氷竜は初回の透過処理に背景が残ったため、元の4方向画像に次のプロンプトで再実行し、その結果を採用。

Extract all 4 blue ice dragon sprites and remove the entire gray and white checkerboard background. Output the sprites on a transparent background. Keep every dragon exactly as drawn, in the same positions. The PNG must have actual transparent alpha, NOT an image of checkerboard squares.
