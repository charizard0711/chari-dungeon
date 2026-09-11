# 11〜15階のボス・4方向

作成日: 2026-09-11。使用モード: built-in `image_gen`（作画・透過処理）。各体4枚、256×256 RGBAアトラス。共通の控えめな揺れ、固定サイズ、116msの補間移動を使用。

| 階 | ボス | 属性・動作 | 保存先 |
|---|---|---|---|
| 11 | 白翼のセラフィム | 無属性・槍／魔力衝撃 | `C:/chari-dungeon-release-final/public/assets/monsters/directional/seraph-directions-v1.png` |
| 12 | アビスドラゴン | 闇・魔力弾／転移 | `C:/chari-dungeon-release-final/public/assets/monsters/directional/abyss-directions-v1.png` |
| 13 | 氷冠の騎士 | 氷・大剣／直線の冷気 | `C:/chari-dungeon-release-final/public/assets/monsters/directional/ice-knight-directions-v1.png` |
| 14 | 雷霆王ゼウス | 雷・遠距離／十字雷撃 | `C:/chari-dungeon-release-final/public/assets/monsters/directional/thunder-sovereign-directions-v1.png` |
| 15 | 炉心王タイタン | 火・既存の炉心震撃 | `C:/chari-dungeon-release-final/public/assets/monsters/directional/titan-directions-v1.png` |

11〜14階は専用モンスターキーで差し替え。通常の真鍮竜・虚空竜・骨竜・ヒュドラと26〜29階の派生は維持。15階はユーザー確認済みの専用ボス部屋のタイタンを更新。闇はモンスター専用属性として追加し、既存4属性の武器・盾・相性抽選は維持。闇と既存4属性間の倍率は1.0。

新規ベース画像（アトラス前面128×128、PNG）:
- `C:/chari-dungeon-release-final/public/assets/monsters/m_silver_seraph.png`
- `C:/chari-dungeon-release-final/public/assets/monsters/m_abyss_dragon.png`
- `C:/chari-dungeon-release-final/public/assets/monsters/m_ice_knight.png`
- `C:/chari-dungeon-release-final/public/assets/monsters/m_thunder_sovereign.png`

## 検証

- `npm run build`: 成功。
- `node scripts/qa-movement-input.mjs`: 入力予約、長押し、4方向、位置／拡縮維持、補間・攻撃タイミング検証成功。16種アトラスが256×256 RGBAかつ各128KiB未満。
- `node scripts/qa-custom-floor-bosses.cjs`: 実際の階層出現、11〜14の属性・攻撃対応、15タイタン、属性表示、旧ボスと後半階層の維持を検証。
- ブラウザー `qa/input-response.html`: 11〜15階すべて、20msの下→左入力を2回送信して2行動／予約なし／処理完了を確認。15階で初期状態以外からの一回に追加行動を観測し、初期状態から再実行して2入力2行動を確認。
- 4方向の描き分け、背面、透過、実ゲーム表示を目視確認。
- `qa/ember-directions.html?floor=11` から15階までの各4方向を確認可能。15階のゲームURLは `/?qa-game&qa-floor=15&qa-boss&qa-field-arena`。

## プロンプトセットと生成元

### seraph

使用モード: built-in image_gen。

参照画像:
- `C:/Users/masam/AppData/Local/Temp/codex-clipboard-5c988894-5805-4142-b7f0-4353d62a0f9d.png`
- `C:/chari-dungeon-release-final/public/assets/monsters/directional/aurelius-directions-v1.png`

初回作画: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-1d2bda18-bd71-4a3c-a5d6-a4ab3465613a.png`

採用透過画像: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-0caa3223-540a-49b4-80f2-21f145157172.png`

作画プロンプト:

Use case: stylized-concept. Asset type: fantasy dungeon RPG four-direction sprite sheet. Exactly FOUR complete drawings of ONE character arranged in a strict 2x2 square grid. TOP LEFT down/front; TOP RIGHT left-facing side profile; BOTTOM LEFT right-facing side profile; BOTTOM RIGHT up/TRUE BACK VIEW, no front face. Same body size and baseline. Calm ready standing pose, four orientations not animation frames. Entire figure, wings, weapon and feet must stay within each equal square quadrant, 12% empty margins, clean central gutters. Rich crisp pixel-art illustration matching the provided game sprite style: stepped dark outlines, layered painted highlight pixels, compact RPG proportions, readable at 50 pixels tall. Output actual transparent PNG alpha background, not painted checkerboard. No floor, ground shadow, scene, grid, text, labels, UI, minions, additional panels, external particles or broad glow clouds.
Image1 is SUBJECT reference only: its central towering silver-white winged angel warrior. Ignore the screenshot UI, text, background and little minions. Image2 is PIXEL ILLUSTRATION STYLE and four-view layout reference only, do not copy its demon anatomy or colors. Create an elegant imposing winged humanoid boss with TWO tall layered white feather wings rising over its shoulders, silver winged helmet, silver breastplate and gauntlets, long ivory-white armored skirt/robe and silver boots. Carry ONE slender long dark-silver spear, held diagonally low in right hand, entire spear fits the cell. Ivory feathers with cool grey shaded depth, subtle antique gold joints, readable silver silhouette. No flames, demon horns, bat wings or dragon tail. All views consistently show same helmet armor and spear; genuine rear view shows feathered back wings, rear helmet, rear robe folds.

透過プロンプト:

Use case: background-extraction. Extract all FOUR sprites and remove the entire grey and white checkerboard background. Output actual transparent PNG alpha. Keep every sprite exactly as drawn, same 2x2 layout, same size and position, all wings, sword/spear, tail, colors and intricate edges unchanged. Keep all four drawings separated and complete. No background or added shadow. Transparency must be real alpha, not a painted checkerboard.

初回透過結果に背景が残ったため再透過。最終透過プロンプト:

Remove the checkerboard background and make the background transparent. Keep all four winged knight sprites and their white feathers fully opaque and unchanged. Transparent background.

### abyss

使用モード: built-in image_gen。

参照画像:
- `C:/chari-dungeon-release-final/public/assets/monsters/m_void_drake.png`

初回作画: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-1b881efb-84ff-4b0f-afd8-eaea031c9968.png`

採用透過画像: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-524dbe34-201b-483b-80e8-559b3b392d9c.png`

作画プロンプト:

Use case: stylized-concept. Asset type: fantasy dungeon RPG four-direction sprite sheet. Exactly FOUR complete drawings of ONE character arranged in a strict 2x2 square grid. TOP LEFT down/front; TOP RIGHT left-facing side profile; BOTTOM LEFT right-facing side profile; BOTTOM RIGHT up/TRUE BACK VIEW, no front face. Same body size and baseline. Calm ready standing pose, four orientations not animation frames. Entire figure, wings, weapon and feet must stay within each equal square quadrant, 12% empty margins, clean central gutters. Rich crisp pixel-art illustration matching the provided game sprite style: stepped dark outlines, layered painted highlight pixels, compact RPG proportions, readable at 50 pixels tall. Output actual transparent PNG alpha background, not painted checkerboard. No floor, ground shadow, scene, grid, text, labels, UI, minions, additional panels, external particles or broad glow clouds.
The reference is the existing dark dragon identity and illustration style. Redraw this ABYSS DRAGON in four directions: one fierce black-purple armored dragon, angular swept-back purple horns, serrated amethyst scale ridges, TWO batlike wings with dark violet membranes, thick rear legs and clawed front arms, curled tapering tail, glowing small violet eyes. Preserve its compact powerful reptile anatomy and elaborate scale shading. Dark charcoal/obsidian scales with clear lavender edge highlights so visible against dark dungeon. No blue ice, yellow lightning, golden plating, human clothing, extra heads or floating aura. Same tail and wing anatomy in all four orientations; true rear view of horns, back plates, folded/opened wing backs and tail, no face on back.

透過プロンプト:

Use case: background-extraction. Extract all FOUR sprites and remove the entire grey and white checkerboard background. Output actual transparent PNG alpha. Keep every sprite exactly as drawn, same 2x2 layout, same size and position, all wings, sword/spear, tail, colors and intricate edges unchanged. Keep all four drawings separated and complete. No background or added shadow. Transparency must be real alpha, not a painted checkerboard.

### ice-knight

使用モード: built-in image_gen。

参照画像:
- `C:/Users/masam/AppData/Local/Temp/codex-clipboard-e61ff40c-d028-495f-b3c5-08a52add6783.png`
- `C:/chari-dungeon-release-final/public/assets/monsters/directional/aurelius-directions-v1.png`

初回作画: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-2e81ecfb-4345-4f4c-af2a-6bab5209afd0.png`

採用透過画像: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-64ad073d-9036-40d7-bcc7-72daf3e71886.png`

作画プロンプト:

Use case: stylized-concept. Asset type: fantasy dungeon RPG four-direction sprite sheet. Exactly FOUR complete drawings of ONE character arranged in a strict 2x2 square grid. TOP LEFT down/front; TOP RIGHT left-facing side profile; BOTTOM LEFT right-facing side profile; BOTTOM RIGHT up/TRUE BACK VIEW, no front face. Same body size and baseline. Calm ready standing pose, four orientations not animation frames. Entire figure, wings, weapon and feet must stay within each equal square quadrant, 12% empty margins, clean central gutters. Rich crisp pixel-art illustration matching the provided game sprite style: stepped dark outlines, layered painted highlight pixels, compact RPG proportions, readable at 50 pixels tall. Output actual transparent PNG alpha background, not painted checkerboard. No floor, ground shadow, scene, grid, text, labels, UI, minions, additional panels, external particles or broad glow clouds.
Image1 is SUBJECT reference: a massive ice-armored humanoid knight. Image2 is PIXEL ART STYLE reference only, do not copy demon shape or colors. Create an imposing ICE KNIGHT, a broad full-plate humanoid entirely encased in silver-blue frozen armor and translucent crystalline ice plates, jagged ice crown/closed helmet with narrow cyan eye slit, huge spiked icy pauldrons, layered frozen breastplate, gauntlets and armored boots. One broad long crystalline ice greatsword held down in its RIGHT hand. Dark navy undersuit creates contrast beneath pale ice. No visible human skin, wings, tail, dragon head, skeletal face, fire, lightning or shield. Keep sword in same anatomical hand as it turns. True rear shows armored back, rear ice crest and back of helmet; no eyes or front breastplate on back.

透過プロンプト:

Use case: background-extraction. Extract all FOUR sprites and remove the entire grey and white checkerboard background. Output actual transparent PNG alpha. Keep every sprite exactly as drawn, same 2x2 layout, same size and position, all wings, sword/spear, tail, colors and intricate edges unchanged. Keep all four drawings separated and complete. No background or added shadow. Transparency must be real alpha, not a painted checkerboard.

### thunder-sovereign

使用モード: built-in image_gen。

参照画像:
- `C:/Users/masam/AppData/Local/Temp/codex-clipboard-d4a0e180-afdb-466c-8841-e549ac976d05.png`
- `C:/chari-dungeon-release-final/public/assets/monsters/directional/aurelius-directions-v1.png`

初回作画: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-7c9dd345-4d9e-457d-be37-8b61c45c91e5.png`

採用透過画像: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-7c9dd345-4d9e-457d-be37-8b61c45c91e5.png`

作画プロンプト:

Use case: stylized-concept. Asset type: fantasy dungeon RPG four-direction sprite sheet. Exactly FOUR complete drawings of ONE character arranged in a strict 2x2 square grid. TOP LEFT down/front; TOP RIGHT left-facing side profile; BOTTOM LEFT right-facing side profile; BOTTOM RIGHT up/TRUE BACK VIEW, no front face. Same body size and baseline. Calm ready standing pose, four orientations not animation frames. Entire figure, wings, weapon and feet must stay within each equal square quadrant, 12% empty margins, clean central gutters. Rich crisp pixel-art illustration matching the provided game sprite style: stepped dark outlines, layered painted highlight pixels, compact RPG proportions, readable at 50 pixels tall. Output actual transparent PNG alpha background, not painted checkerboard. No floor, ground shadow, scene, grid, text, labels, UI, minions, additional panels, external particles or broad glow clouds.
Image1 is SUBJECT reference: a Zeus-like muscular older storm god with white hair, full long white beard, bare muscular chest, dark draped robe and ancient gold accents. Image2 is PIXEL ART STYLE reference only; don't copy demon anatomy/colors. Create a thunder sovereign: stern handsome elderly male deity, swept silver-white hair and flowing white beard, bare broad chest, one black/navy draped shoulder cloak, gold ancient Greek armlets and belt, dark navy long waist robe with slit, gold sandals. Hold ONE clearly defined small bright pale yellow lightning-bolt spear in his RIGHT hand, as a solid jagged luminous weapon contained inside the silhouette margin. Gold-white accents. Other arm slightly extended. No wings, horns, crown taller than head, modern clothing, giant lightning storm, background bolts or broad particles. Same robe and hand placement in all views. True back view shows rear white hair, back muscles and cloak, no beard or face on the back.

### titan

使用モード: built-in image_gen。

参照画像:
- `C:/chari-dungeon-release-final/public/assets/monsters/m_bone_colossus.png`

初回作画: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-c08dfd6a-569c-4a6a-9bbe-8eb228a419ff.png`

採用透過画像: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-2ab9bf67-46d6-407f-b2a2-163995b3df1b.png`

作画プロンプト:

Use case: stylized-concept. Asset type: fantasy dungeon RPG four-direction sprite sheet. Redraw the EXACT existing furnace king TITAN in the reference, preserving its identity and rich pixel-art illustration style. A massive stocky mechanical iron golem, rounded brass/black iron riveted boiler torso, bright orange furnace grate in the belly, small recessed round mechanical head with orange eyes, two tall smokestacks behind shoulders, thick cylindrical segmented arms with enormous squared iron fists, broad short armored legs. Bronze pipes and antique brass trim, heavy dark iron plates with orange fire visible ONLY in vents and furnace. Exactly FOUR complete drawings in a strict 2x2 square grid: TOP LEFT down/front, TOP RIGHT left-facing profile, BOTTOM LEFT right-facing profile, BOTTOM RIGHT up/TRUE BACK view. Back view shows rear boiler shell, pipework, smokestacks and rear leg armor, not a second face or front furnace grate. Same body size and foot baseline throughout, neutral ready stance. Every fist, chimney and foot within own quadrant, generous 12% empty margins and clear central gutters. Crisp stepped dark outlines and layered shaded pixel clusters, compact RPG silhouette readable at 70 pixels tall, same original illustration touch. Real transparent PNG alpha background, no painted checkerboard, no labels/grid/text, floor, shadow, scene, smoke clouds, external fire particles, additional frames or characters. No skeleton anatomy, organic arms, weapon or added wings.

透過プロンプト:

Use case: background-extraction. Extract all FOUR furnace titan sprites and remove the entire grey and white checkerboard background. Output actual transparent PNG alpha. Keep every sprite exactly as drawn, same 2x2 layout, same size and position, all iron fists, pipes, chimneys, orange fire, bronze plates and intricate edges unchanged. All four drawings must remain separate and complete. No background or added shadow. Transparency must be real alpha, not a painted checkerboard.

初回透過結果に背景が残ったため再透過。最終透過プロンプト:

Remove the checkerboard background and make the background transparent. Keep all four metal furnace golem sprites fully opaque and unchanged. Transparent background.

## パッキング

`scripts/prepare-monster-directions.cjs` で生成済みの透過を保持し、共通倍率・足元基準で4方向を128pxセルに配置。背景の削除はimage_genに限定し、パッキングは切り出し・縮小・配置のみ。
