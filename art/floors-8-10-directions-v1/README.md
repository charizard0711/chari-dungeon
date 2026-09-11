# 8・9階の新ボスと10階グランドバイソンの4方向

2026-09-11。画像はすべて built-in image_gen で生成し、同じツールで透明背景に抽出。Sharpは透過済み画像の共通倍率での縮小・パッキングと、正面セルの取り出しのみ。

## 実装

- 8階: 黒衣の魔術師。黒いローブ・杖・魔導書。無属性の通常攻撃・遠距離魔力弾・予告付きの魔力衝撃。属性の弱点/耐性、炎や氷の残留床なし。
- 9階: 選択中のプレイヤーが男性なら対の女剣士、女性なら対の剣士。各方向に剣と盾を描画。
- 装備は武器[B] ルーン鋼剣（w_rune_saber）、盾[B] 反撃盾ヴァイン（s_thorn_guard）、服[B] 騎士の板金鎧（plate）。実際の装備生成関数から作り、攻撃力・防御力の元の数値へ反映。その上で既存の階ボス倍率を適用。装備は各遭遇ごとに新しいオブジェクト。
- 8・9階は人型のため既存ドラゴンの拡大倍率1.32を使わず、基準40px。属性未指定とは別に `element: null` で明示的に無属性とし、従来の自動属性割当てを無効化。
- 10階: ユーザー確認に従い専用ボス部屋のグランドバイソン（m_horn_demon）を元の姿で描き直し。既存サイズ1.82倍とボス設定を維持。同種の通常敵も新しい方向絵を使用。
- 4方向のセル並びは下・左・右・上。各256×256 RGBA、128pxセル、artSize=120、足元y=118。1〜7階と同じ滑らかな揺れ・傾き・移動・攻撃を共有し、体の伸縮なし。
- 突進では待機位置へ戻す攻撃のtweenを重ねず、突進の完了をターン処理が待つ。移動先と実際の描画位置が一致する。
- 23・24階など後半の既存ドラゴン配置は維持。
- QAの性別指定はそのテストだけに適用し、保存中のプレイヤー選択を書き換えない。

## 保存した画像

- [black-mage-directions-v1.png](../../public/assets/monsters/directional/black-mage-directions-v1.png) — 60,313 bytes
- [rival-male-directions-v1.png](../../public/assets/monsters/directional/rival-male-directions-v1.png) — 70,250 bytes
- [rival-female-directions-v1.png](../../public/assets/monsters/directional/rival-female-directions-v1.png) — 64,310 bytes
- [bison-directions-v1.png](../../public/assets/monsters/directional/bison-directions-v1.png) — 79,213 bytes

新規の正面テクスチャ: `public/assets/monsters/m_black_mage.png`、`m_rival_male.png`、`m_rival_female.png`。

## 検証

- `node scripts/qa-movement-input.mjs`: 11種×4方向、方向キーの短押し保持・連続移動・停止・座標/サイズ保持・攻撃時間を確認。
- `node scripts/qa-custom-floor-bosses.cjs`: 無属性の攻撃/防御計算、既存属性維持、性別が反対、B装備と数値、実際のスポーン関数、後半階の配置維持、突進と攻撃位置のtweenが競合せず完了待ちすることを確認。
- 実ブラウザー: 8階・9階男主人公・9階女主人公・10階の全4条件で20ms短押し2回（うち1回は処理中）→2行動を確認。期待位置で停止、入力予約なし、各新テクスチャを確認。
- 9階は男女両方で敵が反対の性別、装備3点がBであることをゲームの状態で確認。男主人公テストでも保存済みfemale選択が保持されることを修正後に確認。
- 4種のプレビューで透明背景、欠けのない4方向、上向きの後ろ姿、剣・盾・鎧を確認。
- `npm run build` / `git diff --check`。

## 表示

- [8階ゲーム](http://localhost:5173/?qa-game&qa-floor=8&qa-field-arena)
- [9階ゲーム（保存済みの選択を使用）](http://localhost:5173/?qa-game&qa-floor=9&qa-field-arena)
- [10階グランドバイソン](http://localhost:5173/?qa-game&qa-floor=10&qa-boss&qa-field-arena)
- [4方向プレビュー](http://localhost:5173/qa/ember-directions.html?floor=8)

## 制作プロンプトと生成ファイル

### black-mage — built-in image_gen

参照画像:
- `C:\chari-dungeon-release-final\public\assets\monsters\m_horn_demon.png`

- 作画出力: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-59549575-5011-46f5-b736-5a51c5e42dea.png`
- 採用した透過出力: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-8bc9ebac-a35f-4d73-97ee-6896f1b54afd.png`
- パッキング: `node scripts/prepare-monster-directions.cjs SOURCE public/assets/monsters/directional/black-mage-directions-v1.png`

作画プロンプト:

Use case: stylized-concept. Asset type: fantasy dungeon RPG four-direction sprite sheet. Exactly FOUR complete drawings of ONE character arranged in a strict 2x2 square grid, same body size and feet baseline in all cells. TOP LEFT down/front, TOP RIGHT left profile, BOTTOM LEFT right profile, BOTTOM RIGHT up/TRUE BACK view, no front face visible from behind. Calm ready standing pose only, not animation frames. Entire figure, held gear, cape, horns, and feet stay inside its own equal square quadrant with generous 12% empty margins and clean central gutters. Crisp rich pixel-art illustration, stepped dark outlines, layered highlights and shadow pixels, compact RPG sprite proportions, legible small silhouette. Real transparent PNG alpha background, NOT drawn checkerboard. No ground shadow, floor, scene, grid, labels, text, extra panels, attack flashes or particles.
Create a NEW BLACK-ROBED HUMAN MAGICIAN with a mysterious black hood, shadowed human face with small pale silver eyes, charcoal black layered robes with subtle neutral grey/silver embroidery, black shoulder mantle and long sleeves, dark boots, slim belt, and one tall black carved staff capped by a subdued clear smoky-grey crystal. The other hand holds a closed dark spellbook. NON-ELEMENTAL magician: no fire, ice, lightning, colored elemental gems or flame glow. Use silver edge highlights so the black clothing remains readable in a dark dungeon. No horns, wings, tail, armor, skull head or monster body. Attached demon is STYLE REFERENCE ONLY; create a human mage, do not copy its anatomy or red colors. In back view show rear hood and cape folds, staff remains on anatomically the same hand.

透過プロンプト:

Extract all 4 black-robed magician sprites and remove the entire grey and white checkerboard background. Output the sprites on a transparent background. Keep every character exactly as drawn, in the same positions and size, including all equipment and all small edges. The PNG must have actual transparent alpha, NOT an image of checkerboard squares.

### rival-male — built-in image_gen

参照画像:
- `C:\chari-dungeon-release-final\public\assets\characters\player\male-plate.png`
- `C:\chari-dungeon-release-final\public\assets\weapons\neutral\rune_saber.png`
- `C:\chari-dungeon-release-final\public\assets\shields\neutral\thorn_guard.png`

- 作画出力: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-ff7b7f79-dc55-4155-93d9-af873c4760fa.png`
- 採用した透過出力: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-ebfdf18c-d0f3-402f-86e5-9b3d604de1b3.png`
- パッキング: `node scripts/prepare-monster-directions.cjs SOURCE public/assets/monsters/directional/rival-male-directions-v1.png`

作画プロンプト:

Use case: stylized-concept. Asset type: fantasy dungeon RPG four-direction sprite sheet. Exactly FOUR complete drawings of ONE character arranged in a strict 2x2 square grid, same body size and feet baseline in all cells. TOP LEFT down/front, TOP RIGHT left profile, BOTTOM LEFT right profile, BOTTOM RIGHT up/TRUE BACK view, no front face visible from behind. Calm ready standing pose only, not animation frames. Entire figure, held gear, cape, horns, and feet stay inside its own equal square quadrant with generous 12% empty margins and clean central gutters. Crisp rich pixel-art illustration, stepped dark outlines, layered highlights and shadow pixels, compact RPG sprite proportions, legible small silhouette. Real transparent PNG alpha background, NOT drawn checkerboard. No ground shadow, floor, scene, grid, labels, text, extra panels, attack flashes or particles.
Create one adult MALE knight, short tousled dark brown hair, masculine face and broad shoulders, based on the character identity and gold/brass plate armor in reference image 1. This is a HUMAN rival adventurer, no horns, wings, monster features or helmet covering the face. Same compact fantasy RPG proportions as the player reference. Equip EXACTLY these THREE existing B-grade items in all views: gold/brass knight plate armor with dark undersuit and armored boots from reference 1; ONE neutral rune-steel straight longsword in RIGHT HAND matching reference 2 (silver-grey steel blade engraved with small dark diamond runes, blue-black grip, steel crossguard, NO magic glow); ONE thorn-guard shield on LEFT ARM matching reference 3 (dark iron and red inset panels, pointed thorn border and central red gem). Keep the sword and shield attached to the SAME anatomical hands as the character turns; do not mirror their equipment sides incorrectly. No bare torso, exposed midriff, added cape, dual swords or extra weapons. Sword and shield must be clearly recognizable and held low enough not to hide the face. Body faces specified direction; rear view shows rear armor and backs of hair, shield on left side and sword on right side.

透過プロンプト:

Extract all 4 male knight with sword and shield sprites and remove the entire grey and white checkerboard background. Output the sprites on a transparent background. Keep every character exactly as drawn, in the same positions and size, including all equipment and all small edges. The PNG must have actual transparent alpha, NOT an image of checkerboard squares.

### rival-female — built-in image_gen

参照画像:
- `C:\chari-dungeon-release-final\public\assets\characters\player\female-plate.png`
- `C:\chari-dungeon-release-final\public\assets\weapons\neutral\rune_saber.png`
- `C:\chari-dungeon-release-final\public\assets\shields\neutral\thorn_guard.png`

- 作画出力: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-090933ae-d165-4a2a-8ac6-263af1b5a3c5.png`
- 採用した透過出力: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-93d5d6f3-7549-44ee-81d6-1307c07f7b15.png`
- パッキング: `node scripts/prepare-monster-directions.cjs SOURCE public/assets/monsters/directional/rival-female-directions-v1.png`

作画プロンプト:

Use case: stylized-concept. Asset type: fantasy dungeon RPG four-direction sprite sheet. Exactly FOUR complete drawings of ONE character arranged in a strict 2x2 square grid, same body size and feet baseline in all cells. TOP LEFT down/front, TOP RIGHT left profile, BOTTOM LEFT right profile, BOTTOM RIGHT up/TRUE BACK view, no front face visible from behind. Calm ready standing pose only, not animation frames. Entire figure, held gear, cape, horns, and feet stay inside its own equal square quadrant with generous 12% empty margins and clean central gutters. Crisp rich pixel-art illustration, stepped dark outlines, layered highlights and shadow pixels, compact RPG sprite proportions, legible small silhouette. Real transparent PNG alpha background, NOT drawn checkerboard. No ground shadow, floor, scene, grid, labels, text, extra panels, attack flashes or particles.
Create one adult FEMALE knight, auburn red-brown shoulder-length hair, feminine face, based on the character identity and gold/brass plate armor in reference image 1. This is a HUMAN rival adventurer, no horns, wings, monster features or helmet covering the face. Same compact fantasy RPG proportions as the player reference. Equip EXACTLY these THREE existing B-grade items in all views: gold/brass knight plate armor with dark undersuit and armored boots from reference 1; ONE neutral rune-steel straight longsword in RIGHT HAND matching reference 2 (silver-grey steel blade engraved with small dark diamond runes, blue-black grip, steel crossguard, NO magic glow); ONE thorn-guard shield on LEFT ARM matching reference 3 (dark iron and red inset panels, pointed thorn border and central red gem). Keep the sword and shield attached to the SAME anatomical hands as the character turns; do not mirror their equipment sides incorrectly. No bare torso, exposed midriff, added cape, dual swords or extra weapons. Sword and shield must be clearly recognizable and held low enough not to hide the face. Body faces specified direction; rear view shows rear armor and backs of hair, shield on left side and sword on right side.

透過プロンプト:

Extract all 4 female knight with sword and shield sprites and remove the entire grey and white checkerboard background. Output the sprites on a transparent background. Keep every character exactly as drawn, in the same positions and size, including all equipment and all small edges. The PNG must have actual transparent alpha, NOT an image of checkerboard squares.

### bison — built-in image_gen

参照画像:
- `C:\chari-dungeon-release-final\public\assets\monsters\m_horn_demon.png`

- 作画出力: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-91941b99-c884-4a6f-9f49-92efe8ad1d46.png`
- 採用した透過出力: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-3a240557-1d39-4dc0-b1f4-1c2dd251036d.png`
- パッキング: `node scripts/prepare-monster-directions.cjs SOURCE public/assets/monsters/directional/bison-directions-v1.png`

作画プロンプト:

Use case: stylized-concept. Asset type: fantasy dungeon RPG four-direction sprite sheet. Exactly FOUR complete drawings of ONE character arranged in a strict 2x2 square grid, same body size and feet baseline in all cells. TOP LEFT down/front, TOP RIGHT left profile, BOTTOM LEFT right profile, BOTTOM RIGHT up/TRUE BACK view, no front face visible from behind. Calm ready standing pose only, not animation frames. Entire figure, held gear, cape, horns, and feet stay inside its own equal square quadrant with generous 12% empty margins and clean central gutters. Crisp rich pixel-art illustration, stepped dark outlines, layered highlights and shadow pixels, compact RPG sprite proportions, legible small silhouette. Real transparent PNG alpha background, NOT drawn checkerboard. No ground shadow, floor, scene, grid, labels, text, extra panels, attack flashes or particles.
Turn around the EXACT existing GRAND BISON boss in the reference: massive stocky bipedal red-skinned horned demon with TWO large swept upward ivory horns, angry fanged ogre face, broad chest, black iron plate shoulders with spikes and antique gold edging, red muscular arms, massive clawed hands, heavy dark metal gauntlets, skull belt buckle, dark armored greaves and bare three-clawed red feet. Preserve original body proportions and rich shading. NO wings, tail, weapon, staff, shield or added horns. Full back view shows rear skull and horn roots, back muscles and armor, NO front face or skull belt on its back. Match the original illustration, not a literal quadruped buffalo.

透過プロンプト:

Extract all 4 red horned armored demon sprites and remove the entire grey and white checkerboard background. Output the sprites on a transparent background. Keep every character exactly as drawn, in the same positions and size, including all equipment and all small edges. The PNG must have actual transparent alpha, NOT an image of checkerboard squares.
