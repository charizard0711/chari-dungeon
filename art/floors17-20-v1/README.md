# 17–20階の新ボスと20階・氷晶の広間

生成日: 2026-09-11–12 / Built-in imagegen。

17: 紅蓮のフェニックス（炎）、18: 蒼鬣のユニコーン（無属性）、19: 骸骨の大鎌使い（闇）、20: 氷晶王ベヒーモス（氷）。ユーザーの4参考画像から、それぞれオリジナルのゲーム用イラストを制作。

ボスは下・左・右・上の4枚を256×256 RGBAシート（各128×128）に格納。既存の連続した微小な揺れ、116msの移動／攻撃を使用。倍率を周期的に変える演出は追加しない。

20階の専用部屋は21×15の角を落とした広間。氷の床・壁と4種類の新オブジェ（氷晶、氷柱、雪岩、祭壇）を配置。障害物8個は壁セルとして衝突を統一、中央は広く確保。床絵による強制スライドは発生しない。入口から全歩行床および撃破後の出口へ到達できる。氷晶王は飛翔せず予告した十字へ地上の氷晶震撃を放つ。

## ボス画像の生成記録

### phoenix

Mode: reference-guided generation (imagegen with referenced_image_paths).

References:
- `C:/Users/masam/AppData/Local/Temp/codex-clipboard-baa1a83d-cec0-4dd7-96f2-87e88c958d88.png`
- `C:/chari-dungeon-release-final/public/assets/monsters/directional/titan-directions-v1.png`

Initial source: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-769ce766-5f01-4e61-8efe-ea8acf5a626e.png`

Alpha edit source: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-3b39990b-dd59-4d1c-b4a7-b1dd559973b5.png`

Runtime: `public/assets/monsters/directional/phoenix-directions-v1.png` and `public/assets/monsters/m_phoenix.png`.

Prompt:

```text
Use case: stylized-concept. Asset type: fantasy dungeon RPG four-direction sprite sheet. Image1 gives SUBJECT inspiration only; image2 gives the established game's detailed pixel illustration style and 2x2 layout only. Make original artwork; no screenshot UI, watermarks, lettering or logos. Exactly FOUR complete drawings of ONE same creature in a strict 2x2 square grid: TOP LEFT down/front, TOP RIGHT left-facing profile, BOTTOM LEFT right-facing profile, BOTTOM RIGHT up/TRUE BACK view, no face on back. Same body size and feet baseline. Neutral ready stance, no extra animation frames. Full figure and all wings/tail/weapon/feet fit within each equal square quadrant, generous 12% clear margins and clean gutters. Crisp stepped outlines, rich shaded pixel clusters and layered highlights, compact fantasy RPG sprite proportions, readable at 50-70 pixels. Actual transparent PNG alpha background. No floor, shadow, grid, labels, particles, surrounding aura, scenery or extra figures. Create a majestic PHOENIX fire bird with long elegant neck, small sharp beak and swept golden head crest, two huge feathered wings arched upward, rich scarlet/orange/golden feather layers, gold talons and several graceful flowing tail plumes curled upward near the feet to fit the cell. Inspired by the reference's elegant wing and tail silhouette, but fully shaded pixel illustration, not a flat logo. Ember-red body, bright golden wing edges, individual feathers. Two legs, two wings, one head. No human body, armor, reptile anatomy, extra wings or long isolated trails. In rear view show wing backs and tail roots, no front beak/eyes.
```

### unicorn

Mode: reference-guided generation (imagegen with referenced_image_paths).

References:
- `C:/Users/masam/AppData/Local/Temp/codex-clipboard-f00f9784-1186-41e8-8997-373eccbb871c.png`
- `C:/chari-dungeon-release-final/public/assets/monsters/directional/titan-directions-v1.png`

Initial source: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-0028adbd-c1b6-44de-9899-2e355a5aad14.png`

Alpha edit source: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-6dcba353-b698-43b8-91c0-46b69fa4168d.png`

Runtime: `public/assets/monsters/directional/unicorn-directions-v1.png` and `public/assets/monsters/m_unicorn.png`.

Prompt:

```text
Use case: stylized-concept. Asset type: fantasy dungeon RPG four-direction sprite sheet. Image1 gives SUBJECT inspiration only; image2 gives the established game's detailed pixel illustration style and 2x2 layout only. Make original artwork; no screenshot UI, watermarks, lettering or logos. Exactly FOUR complete drawings of ONE same creature in a strict 2x2 square grid: TOP LEFT down/front, TOP RIGHT left-facing profile, BOTTOM LEFT right-facing profile, BOTTOM RIGHT up/TRUE BACK view, no face on back. Same body size and feet baseline. Neutral ready stance, no extra animation frames. Full figure and all wings/tail/weapon/feet fit within each equal square quadrant, generous 12% clear margins and clean gutters. Crisp stepped outlines, rich shaded pixel clusters and layered highlights, compact fantasy RPG sprite proportions, readable at 50-70 pixels. Actual transparent PNG alpha background. No floor, shadow, grid, labels, particles, surrounding aura, scenery or extra figures. Create an elegant UNICORN, a strong pure white horse with one long spiraled pale-gold horn centered on its forehead, blue-violet flowing mane and a bushy curled lavender-blue tail, four silver-white legs and pale hooves, expressive dark eyes. Reference is subject and palette only, use richly shaded pixel art with subtle cool blue shadows on white coat. Calm powerful four-legged stance, one front hoof lightly raised. No wings, harness, rider, armor, jewels, second horn or human anatomy. All four views keep the horn correctly attached and tail at rear. Front view looks toward camera, profile horse body truly left/right, rear view shows back of mane and tail, no face.
```

### bone-reaper

Mode: reference-guided generation (imagegen with referenced_image_paths).

References:
- `C:/Users/masam/AppData/Local/Temp/codex-clipboard-0756595e-eabb-4624-a246-7ad271f14f80.png`
- `C:/chari-dungeon-release-final/public/assets/monsters/directional/titan-directions-v1.png`

Initial source: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-f45f2215-9c7b-49b3-a5ee-46096e963773.png`

Alpha edit source: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-523c504b-1dde-42ac-a489-054283220105.png`

Runtime: `public/assets/monsters/directional/bone-reaper-directions-v1.png` and `public/assets/monsters/m_bone_reaper.png`.

Prompt:

```text
Use case: stylized-concept. Asset type: fantasy dungeon RPG four-direction sprite sheet. Image1 gives SUBJECT inspiration only; image2 gives the established game's detailed pixel illustration style and 2x2 layout only. Make original artwork; no screenshot UI, watermarks, lettering or logos. Exactly FOUR complete drawings of ONE same creature in a strict 2x2 square grid: TOP LEFT down/front, TOP RIGHT left-facing profile, BOTTOM LEFT right-facing profile, BOTTOM RIGHT up/TRUE BACK view, no face on back. Same body size and feet baseline. Neutral ready stance, no extra animation frames. Full figure and all wings/tail/weapon/feet fit within each equal square quadrant, generous 12% clear margins and clean gutters. Crisp stepped outlines, rich shaded pixel clusters and layered highlights, compact fantasy RPG sprite proportions, readable at 50-70 pixels. Actual transparent PNG alpha background. No floor, shadow, grid, labels, particles, surrounding aura, scenery or extra figures. Create a tall imposing SKELETON WARRIOR with yellowed ivory bones, clearly defined skull with small ominous red eye sockets, open ribcage, spine, pelvis, long bony arms and legs. Carry ONE long dark iron polearm with a broad curved scythe-like blade at one end, held diagonally low with both hands, complete weapon inside each cell. Subject inspired by skeleton and dark polearm in reference, but original fantasy pixel art, not toy photography. Keep readable sturdy bone silhouette, articulated joints, bone-grey shading. No clothing, armor, wings, extra skulls, flesh or blood. Ready combat stance with slightly bent knees. True back shows back of skull, spine and posterior ribs/pelvis; no glowing eyes on rear skull.
```

### ice-behemoth

Mode: reference-guided generation (imagegen with referenced_image_paths).

References:
- `C:/Users/masam/AppData/Local/Temp/codex-clipboard-3404649d-f513-4eb5-836e-b41b168b3b04.png`
- `C:/chari-dungeon-release-final/public/assets/monsters/directional/titan-directions-v1.png`

Initial source: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-0903b1f5-d175-453a-90a0-250e9b70912b.png`

Alpha edit source: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-2c59e19e-d9b6-4bda-a990-0d6f8d74303d.png`

Runtime: `public/assets/monsters/directional/ice-behemoth-directions-v1.png` and `public/assets/monsters/m_ice_behemoth.png`.

Prompt:

```text
Use case: stylized-concept. Asset type: fantasy dungeon RPG four-direction sprite sheet. Image1 gives SUBJECT inspiration only; image2 gives the established game's detailed pixel illustration style and 2x2 layout only. Make original artwork; no screenshot UI, watermarks, lettering or logos. Exactly FOUR complete drawings of ONE same creature in a strict 2x2 square grid: TOP LEFT down/front, TOP RIGHT left-facing profile, BOTTOM LEFT right-facing profile, BOTTOM RIGHT up/TRUE BACK view, no face on back. Same body size and feet baseline. Neutral ready stance, no extra animation frames. Full figure and all wings/tail/weapon/feet fit within each equal square quadrant, generous 12% clear margins and clean gutters. Crisp stepped outlines, rich shaded pixel clusters and layered highlights, compact fantasy RPG sprite proportions, readable at 50-70 pixels. Actual transparent PNG alpha background. No floor, shadow, grid, labels, particles, surrounding aura, scenery or extra figures. Create a huge stocky ICE BEHEMOTH matching the subject concept of reference: upright bipedal reptilian frost giant, thick dark slate-blue stone-like scaled body, broad hunched shoulders, short fierce reptilian snout, two icy swept horns, massive clawed fists, powerful squat legs and a heavy short spiked tail. Giant jagged translucent turquoise/cyan ice crystal plates sprout along crown, shoulders, forearms and down the back. Pale blue claw tips, cyan eyes, faceted ice highlights with deep navy crevices. This is a hulking ice-armored beast, not a flying dragon or humanoid knight. No wings, weapon, clothes, fire or extra limbs. Back view clearly shows crystal ridge, broad back and heavy tail, no front face or belly plates. Preserve broad chunky mass in every direction.
```

The initial four sheets had opaque checkerboard backgrounds. Built-in imagegen edits created actual alpha; no programmatic background removal was used.

Alpha edit prompt (applied separately to each original sheet):

```text
Remove the checkerboard background and make the background transparent. Keep all four sprites fully opaque and unchanged. Transparent background.
```

## 氷の地形画像

### glacial-floor

Mode: new generation, no reference images.

Source: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-fd596e95-9289-4b59-ad0a-2ea1ee3e27f0.png`

Prompt:

```text
Create one seamless square tile texture for a top-down 2D pixel-art fantasy RPG ice boss arena. Direct overhead view, NO perspective, NO isometric block sides. Opaque edge-to-edge surface of deep desaturated teal-blue glacial ice with restrained cyan frosty grain, subtle large translucent slabs and a few delicate hairline cracks. Keep detail calm and low contrast so small game characters and red attack indicators remain very readable. No objects, borders, text, symbols, lighting bloom, or shadows. Rich hand-painted pixel shading with crisp edges, suited to downsampling into a 64x64 game tile. Tile all four edges seamlessly. Make exactly one square texture.
```

### glacial-wall

Mode: new generation, no reference images.

Source: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-23f2e6b6-4977-44b3-ac61-2bb5fab76539.png`

Prompt:

```text
Create one square game wall tile sprite for a top-down slightly elevated 2D pixel-art fantasy RPG. A solid chunky blue glacial ice boulder wall filling nearly the entire square, irregular faceted dark slate-blue sides, a flattened frosty pale cyan top, modest white snow cap along upper edge, restrained bright cyan ice veins. Front side seen a little at bottom, coherent chunky pixel-shaded game illustration, crisp outline, readable when reduced to 64x64. No environment, floor, text, shadows, glow, particles, or border. Transparent background outside the boulder silhouette, actual PNG alpha. Only one wall tile.
```

### glacial-objects

Mode: new generation, no reference images.

Source: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-b2fdc917-f10f-4bef-a9ac-863704fc02ef.png`

Prompt:

```text
Create a 2x2 object sprite atlas for a top-down slightly elevated 2D pixel-art fantasy RPG ice boss room, exactly four separate complete props on actual transparent alpha background. Each isolated and centered inside its own quadrant, generous 12 percent margin, consistent rendering and scale, no grid or labels. TOP LEFT: majestic tall cluster of jagged cyan ice crystals growing from a dark icy rock base, three major crystals and small shards. TOP RIGHT: ancient slender glacial obelisk pillar with a frosted blue-gray stone pedestal, icy crown and small cyan diamond rune carved in front, no legible writing. BOTTOM LEFT: broad low snow-capped blue boulder, frozen icicles on the front, no grass. BOTTOM RIGHT: a low circular frozen altar, dark blue stone rim, luminous pale turquoise snowflake pattern inset in the top, no flame. Rich hand-painted pixel shading, crisp dark blue outline and cold pale cyan highlights, clean silhouettes, no external cast shadows, no environment, no checkerboard drawn into image, no text, watermarks or bloom. Suitable to downsample each object to 96 pixels. This is one game props atlas.
```

Runtime files: `public/assets/terrain/glacial/{floor,wall,crystal,obelisk,boulder,altar}.png`.

## 加工と確認

Unicorn spacing edit: the first alpha sheet had overlapping drawing bounds. The built-in imagegen tool spaced all four drawings apart before packing.

Final unicorn source: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-d693fef3-1186-497a-a299-86b4aeea687c.png`

Spacing edit prompt:

```text
Rearrange these four unicorn sprites into an evenly spaced 2 by 2 sprite sheet. Make each drawing smaller within its own quadrant with generous empty margins on all sides, so no horn, mane or tail touches another quadrant or the canvas edge. Keep the same four drawings, same facing order and proportions. Transparent background. No checkerboard.
```

`prepare-glacial.cjs` crops and resizes only, preserving generated alpha. Terrain tiles are64×64; each prop uses128×128 RGBA. Top-row object drawings cross the original sheet midpoint, so the crop split is between the complete rows at59.8%height.

Boss packing: `node scripts/prepare-monster-directions.cjs SOURCE public/assets/monsters/directional/NAME-directions-v1.png`.

Verification completed:

- `npm run build` (TypeScript + Vite).
- `node scripts/qa-custom-floor-bosses.cjs`: 17–20 spawn with their own art and affinities; floor20 milestone keeps its HP/attack/defense/scale, now uses the ice beast. Both phases of the grounded ice attack create valid warned tiles and ice hazards without teleporting. Glacial props have real collision, all walkable floor cells are reachable, and other milestone arenas are unchanged.
- `node scripts/qa-movement-input.mjs`: all 21 directional atlases stay below128KiB and use exactly4frames; queued20ms taps, eased motion, unchanged scale, attack timing and the prior teleport recovery fix pass.
- In-browser `qa/input-response.html`: floors17,18,19,20 each passed two20ms key presses → two actions → stopped; each test delivered its second key while the game was busy.
- In-browser `qa/glacial-arena.html`: all6terrain textures loaded, 9props plus stair underlay rendered, actual octagonal arena inspected at overview and normal combat zoom. Game screenshots inspected for all4bosses and floor20 attack warnings.
- `git diff --check` passed.

Preview: `http://localhost:5173/?qa-game&qa-floor=20&qa-boss&qa-field-arena`.
No deployment performed for this request.

## 2026-09-12: 氷マップへ素材を展開

ユーザーの追加依頼により、通常の氷マップ（11–15階）の壁も同じ `terrain_glacial_wall` に変更。従来の石積み壁面と控え柱が氷岩に重ならないようにした。既存の氷床・スライド地形・迷路の形は維持。

氷晶・氷の柱・雪岩・祭壇の4素材を小さくして通常の部屋にも配置。恒久オブジェクトの周りには迂回できる床を確保し、丸い部屋では角に置けない場合だけ内部の空き床を使う。探索用の壊せる樽・壺を最低6個確保する。新たな画像生成や読み込み素材の追加はなく、上記のPNGを共有する。

確認: `npm run build`、`scripts/qa-frost-decor.cjs`（泉を含む125マップ／1,696オブジェクト、恒久オブジェクトが到達経路を分断しないこと・4種類の装飾・補給・既存氷地形を確認）、ボス設定と入力回帰テストが成功。`qa/frost-map.html` で11–15階それぞれの壁テクスチャと4種のオブジェクトを実ブラウザー確認済み。15階の炉心王専用部屋を含む他の専用部屋・他バイオームは維持。

通常マップのプレビュー: `http://localhost:5173/?qa-game&qa-floor=11&qa-room-props=ice`。
