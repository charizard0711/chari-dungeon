# 1〜5階・低い壁のデザイン案

2026-09-12。ユーザー依頼：氷岩の壁が良かったため、1〜5階向けの低く見やすい壁を複数案描いて比較したい。

Mode: built-in image_gen / generate with style references (`stylized-concept`)。コンセプトボードを5枚制作し、ユーザーのリリース指示により左側の低い案をゲーム本体へ実装。

## デザイン

- 1F **低い苔岩** — 入口らしい自然な岩。少しだけ苔を足すと、暗い床でも輪郭が読みやすい。 ファイル: `01-moss-boulders.png`
- 2F **崩れた石積み** — 角の取れた石積み。1階から続く遺跡らしさを出しやすい。 ファイル: `02-weathered-limestone.png`
- 3F **根の絡む石垣** — 薄い石と根で、少し奥に入った雰囲気。根は壁の内側へはみ出させない。 ファイル: `03-rooted-slate.png`
- 4F **深層の黒岩** — 黒岩と明るい上面で深さを演出。通路との境目は明るく保つ。 ファイル: `04-deep-basalt.png`
- 5F **封印の石壁** — 高さは増やさず、金の封印模様でボス階の特別感を出す。 ファイル: `05-sealed-stone.png`

1Fは低い苔岩を推奨。壁の腰程度の高さを基準に、1〜5階で石の素材・色・模様を変える方針。各ボードは左が低め、右が少し高めの比較、下が壁パーツと小物の案。コンセプト画像の比率は目安で、実装時の占有マス・奥行き・キャラとの重なりは別途調整する。

## 見本

`index.html` に5案の一覧とクリック拡大を用意。ローカルViteで `/art/wall-concepts-floors1-5-v1/` を開いて比較できる。

## ゲーム用素材と実装（2026-09-12）

- 完成アトラス: `runtime-1.png` 〜 `runtime-5.png`。生成モードは built-in ImageGen。各階に壁2種と小物2種を描いた。プロンプト全文・元画像は `runtime-sources.json`。
- 使用素材: `C:/chari-dungeon-release-final/public/assets/terrain/ruins-low-v1/{1,2,3,4,5}/{wall-a,wall-b,relic,rubble}.png`。
- 壁は64×64、小物は128×128。`prepare-runtime.cjs` はクロップ・縮小・透過キャンバスへの配置だけを行い、絵と透過は生成画像のものを保持。
- 1〜5階と5.5階の壁を差し替え。高い壁面と支柱の重ね描きを止め、1マス内に低い壁を収めた。常時アニメーションは追加していない。
- 全階の中ボス部屋を10×10に拡大。入口側の迷路を潰さないよう外周側へ拡張。部屋全体の視界を維持し、四隅にテーマ小物2個と樽・壺を配置。5階刻みの別マップの強ボス部屋は広さを維持。
- 全階の通常部屋は配置目標を各1個増加。永久設置物の周囲に歩行可能な1マスの余白を確保。階段・入口・転送床・宝箱予定地を避け、補給用容器は最低6個を保持。
- ボス出現位置、瞬間移動、召喚先はオブジェクトを避ける。
- 実画面の確認: `/qa/room-update.html`。1〜30階と5.5階を切り替え、部屋全景・壁テクスチャ・小物数・敵との重なり・部屋全体の視界を確認できる。
- 検証: `scripts/qa-floor-layouts.ts` 3,600マップ、`scripts/qa-frost-decor.cjs` 全30階750マップで経路・小物・10×10・ボス出現位置を確認。操作入力・方向絵と8〜20階ボスの既存チェックも実行。

## 参照素材

1. 氷岩の壁（描画タッチと明暗のみを参照、雪や氷は新案に使用しない）:
   `C:/Users/masam/.codex/generated_images/01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c/exec-23f2e6b6-4977-44b3-ac61-2bb5fab76539.png`
2. 現在の床タイル:
   `C:/chari-dungeon-release-final/public/assets/terrain/biomes/ruins-floor.png`

## 完成画像とプロンプト


### 1F 低い苔岩

Saved final: `C:/chari-dungeon-release-final/art/wall-concepts-floors1-5-v1/01-moss-boulders.png`

Generated source: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-11a13c02-19f8-4fd5-838f-2a19ed950d25.png`

Prompt (built-in image_gen, generate with style references):

```text
Use case: stylized-concept. Create a polished square pixel-art game wall concept comparison board for floor 1 of a 2D top-down fantasy dungeon RPG.
Input image 1 is a STYLE REFERENCE ONLY: use its rich crisp pixel-shaded chunky stone rendering, but change the material to the following NON-ICE design. Do not copy the snow or cyan ice. Input image 2 is the actual dark stone floor texture reference.
Wall design: Rounded broad natural gray granite boulders with worn flat upper surfaces, a little muted green moss only in crevices. Welcoming ancient dungeon entrance, clear uncomplicated silhouettes, very little ornament. Two matching little props at bottom: a small mossy rock cluster and a broken stone marker. This is the recommended gentle first-floor design.
Composition: a clean charcoal background, generous margins, heading "1F" at top. Two equally sized game-room mockups side by side, with the same floor grid, camera, layout, lighting, and same small brown-haired leather-armored adventurer for scale. Left mockup labelled "低め". Right mockup labelled "少し高め". No other text.
Each room is a small square with low modular stone walls across the rear and along the left and right sides; a short front wall has a central doorway. Orthographic game map: horizontal and vertical grid axes, slightly elevated TOP-DOWN view like classic overhead RPGs, NOT a diamond isometric room, NOT a perspective illustration. Show the surface and short front face of each stone. Dark desaturated stone paving, clean empty walkable center and obvious corridor opening.
CRITICAL HEIGHT COMPARISON: left walls have visible vertical height roughly at the adventurer's WAIST, low and broad with only a small front face; right walls reach the adventurer's CHEST, modestly taller but still below the head. Never tall cliff walls. Put the full-body adventurer directly behind the short foreground wall so the visibility of the head and torso is clear, same pose and size in both mockups.
Below the rooms, show three enlarged isolated wall tile drawings of the SAME design (straight segment, corner block, naturally varied block) and the two matching small props described above, evenly spaced on the charcoal background. These are alternative game-art concepts for discussion, not a gameplay screenshot with UI.
Consistent crisp pixel edges and hand-painted pixel shading, fairly low detail density, clearly separated stone wall from floor, tightly controlled palette, attractive professional game art. No extra heroes, enemies, large towers, roof, busy vegetation, fake UI, watermarks, labels beyond the three specified strings, or dramatic lighting bloom.
```

### 2F 崩れた石積み

Saved final: `C:/chari-dungeon-release-final/art/wall-concepts-floors1-5-v1/02-weathered-limestone.png`

Generated source: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-95c3f710-bde3-43b4-8e78-1f33c9e29940.png`

Prompt (built-in image_gen, generate with style references):

```text
Use case: stylized-concept. Create a polished square pixel-art game wall concept comparison board for floor 2 of a 2D top-down fantasy dungeon RPG.
Input image 1 is a STYLE REFERENCE ONLY: use its rich crisp pixel-shaded chunky stone rendering, but change the material to the following NON-ICE design. Do not copy the snow or cyan ice. Input image 2 is the actual dark stone floor texture reference.
Wall design: Weathered warm gray-beige limestone blocks, chunky roughly rectangular stones with rounded chipped corners, one broad low course, a few smaller repair stones, tiny sparse olive moss patches. Ancient constructed ruin, calm and easy to read, not a brown wood wall. Two matching little props at bottom: a short broken column base and a few fallen stone blocks.
Composition: a clean charcoal background, generous margins, heading "2F" at top. Two equally sized game-room mockups side by side, with the same floor grid, camera, layout, lighting, and same small brown-haired leather-armored adventurer for scale. Left mockup labelled "低め". Right mockup labelled "少し高め". No other text.
Each room is a small square with low modular stone walls across the rear and along the left and right sides; a short front wall has a central doorway. Orthographic game map: horizontal and vertical grid axes, slightly elevated TOP-DOWN view like classic overhead RPGs, NOT a diamond isometric room, NOT a perspective illustration. Show the surface and short front face of each stone. Dark desaturated stone paving, clean empty walkable center and obvious corridor opening.
CRITICAL HEIGHT COMPARISON: left walls have visible vertical height roughly at the adventurer's WAIST, low and broad with only a small front face; right walls reach the adventurer's CHEST, modestly taller but still below the head. Never tall cliff walls. Put the full-body adventurer directly behind the short foreground wall so the visibility of the head and torso is clear, same pose and size in both mockups.
Below the rooms, show three enlarged isolated wall tile drawings of the SAME design (straight segment, corner block, naturally varied block) and the two matching small props described above, evenly spaced on the charcoal background. These are alternative game-art concepts for discussion, not a gameplay screenshot with UI.
Consistent crisp pixel edges and hand-painted pixel shading, fairly low detail density, clearly separated stone wall from floor, tightly controlled palette, attractive professional game art. No extra heroes, enemies, large towers, roof, busy vegetation, fake UI, watermarks, labels beyond the three specified strings, or dramatic lighting bloom.
```

### 3F 根の絡む石垣

Saved final: `C:/chari-dungeon-release-final/art/wall-concepts-floors1-5-v1/03-rooted-slate.png`

Generated source: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-1bd1f6e0-bb72-408b-b861-0e7b04d2e17c.png`

Prompt (built-in image_gen, generate with style references):

```text
Use case: stylized-concept. Create a polished square pixel-art game wall concept comparison board for floor 3 of a 2D top-down fantasy dungeon RPG.
Input image 1 is a STYLE REFERENCE ONLY: use its rich crisp pixel-shaded chunky stone rendering, but change the material to the following NON-ICE design. Do not copy the snow or cyan ice. Input image 2 is the actual dark stone floor texture reference.
Wall design: Cool gray layered flat slate stones, horizontally stratified and cracked, a little dark green moss and thin tree roots confined to joins along the top edges. Deeper old ruins, organic and damp but no water pools. Keep roots small so the wall silhouette remains clear. Two matching little props at bottom: a mossy cracked stone slab and a squat root-wrapped stone pillar stump.
Composition: a clean charcoal background, generous margins, heading "3F" at top. Two equally sized game-room mockups side by side, with the same floor grid, camera, layout, lighting, and same small brown-haired leather-armored adventurer for scale. Left mockup labelled "低め". Right mockup labelled "少し高め". No other text.
Each room is a small square with low modular stone walls across the rear and along the left and right sides; a short front wall has a central doorway. Orthographic game map: horizontal and vertical grid axes, slightly elevated TOP-DOWN view like classic overhead RPGs, NOT a diamond isometric room, NOT a perspective illustration. Show the surface and short front face of each stone. Dark desaturated stone paving, clean empty walkable center and obvious corridor opening.
CRITICAL HEIGHT COMPARISON: left walls have visible vertical height roughly at the adventurer's WAIST, low and broad with only a small front face; right walls reach the adventurer's CHEST, modestly taller but still below the head. Never tall cliff walls. Put the full-body adventurer directly behind the short foreground wall so the visibility of the head and torso is clear, same pose and size in both mockups.
Below the rooms, show three enlarged isolated wall tile drawings of the SAME design (straight segment, corner block, naturally varied block) and the two matching small props described above, evenly spaced on the charcoal background. These are alternative game-art concepts for discussion, not a gameplay screenshot with UI.
Consistent crisp pixel edges and hand-painted pixel shading, fairly low detail density, clearly separated stone wall from floor, tightly controlled palette, attractive professional game art. No extra heroes, enemies, large towers, roof, busy vegetation, fake UI, watermarks, labels beyond the three specified strings, or dramatic lighting bloom.
```

### 4F 深層の黒岩

Saved final: `C:/chari-dungeon-release-final/art/wall-concepts-floors1-5-v1/04-deep-basalt.png`

Generated source: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-38340d95-548d-4ceb-8e33-d3fdd4db0e81.png`

Prompt (built-in image_gen, generate with style references):

```text
Use case: stylized-concept. Create a polished square pixel-art game wall concept comparison board for floor 4 of a 2D top-down fantasy dungeon RPG.
Input image 1 is a STYLE REFERENCE ONLY: use its rich crisp pixel-shaded chunky stone rendering, but change the material to the following NON-ICE design. Do not copy the snow or cyan ice. Input image 2 is the actual dark stone floor texture reference.
Wall design: Low rugged dark charcoal basalt boulders with broad angular facets, medium blue-gray highlights on upper surfaces and restrained rusty iron-colored mineral veins. A deeper cavern-like ancient ruin. The rocks must remain clearly visible against the dark floor; no black-on-black, lava, fire or neon crystals. Two matching little props at bottom: a dark basalt rock cluster and a short weathered iron-bound stone marker.
Composition: a clean charcoal background, generous margins, heading "4F" at top. Two equally sized game-room mockups side by side, with the same floor grid, camera, layout, lighting, and same small brown-haired leather-armored adventurer for scale. Left mockup labelled "低め". Right mockup labelled "少し高め". No other text.
Each room is a small square with low modular stone walls across the rear and along the left and right sides; a short front wall has a central doorway. Orthographic game map: horizontal and vertical grid axes, slightly elevated TOP-DOWN view like classic overhead RPGs, NOT a diamond isometric room, NOT a perspective illustration. Show the surface and short front face of each stone. Dark desaturated stone paving, clean empty walkable center and obvious corridor opening.
CRITICAL HEIGHT COMPARISON: left walls have visible vertical height roughly at the adventurer's WAIST, low and broad with only a small front face; right walls reach the adventurer's CHEST, modestly taller but still below the head. Never tall cliff walls. Put the full-body adventurer directly behind the short foreground wall so the visibility of the head and torso is clear, same pose and size in both mockups.
Below the rooms, show three enlarged isolated wall tile drawings of the SAME design (straight segment, corner block, naturally varied block) and the two matching small props described above, evenly spaced on the charcoal background. These are alternative game-art concepts for discussion, not a gameplay screenshot with UI.
Consistent crisp pixel edges and hand-painted pixel shading, fairly low detail density, clearly separated stone wall from floor, tightly controlled palette, attractive professional game art. No extra heroes, enemies, large towers, roof, busy vegetation, fake UI, watermarks, labels beyond the three specified strings, or dramatic lighting bloom.
```

### 5F 封印の石壁

Saved final: `C:/chari-dungeon-release-final/art/wall-concepts-floors1-5-v1/05-sealed-stone.png`

Generated source: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-9c6cddcf-c20e-4096-991d-f5314069a411.png`

Prompt (built-in image_gen, generate with style references):

```text
Use case: stylized-concept. Create a polished square pixel-art game wall concept comparison board for floor 5 of a 2D top-down fantasy dungeon RPG.
Input image 1 is a STYLE REFERENCE ONLY: use its rich crisp pixel-shaded chunky stone rendering, but change the material to the following NON-ICE design. Do not copy the snow or cyan ice. Input image 2 is the actual dark stone floor texture reference.
Wall design: Low broad ancient blue-gray stone blocks with subtly polished upper faces, chipped edges and a few restrained warm gold engraved geometric seal lines on front faces. First major boss gate / ancient sanctuary mood, distinguished by ornament rather than extra wall height. Gold markings sparse and small, not neon. Two matching little props at bottom: a short seal-carved obelisk stump and a low circular stone seal altar.
Composition: a clean charcoal background, generous margins, heading "5F" at top. Two equally sized game-room mockups side by side, with the same floor grid, camera, layout, lighting, and same small brown-haired leather-armored adventurer for scale. Left mockup labelled "低め". Right mockup labelled "少し高め". No other text.
Each room is a small square with low modular stone walls across the rear and along the left and right sides; a short front wall has a central doorway. Orthographic game map: horizontal and vertical grid axes, slightly elevated TOP-DOWN view like classic overhead RPGs, NOT a diamond isometric room, NOT a perspective illustration. Show the surface and short front face of each stone. Dark desaturated stone paving, clean empty walkable center and obvious corridor opening.
CRITICAL HEIGHT COMPARISON: left walls have visible vertical height roughly at the adventurer's WAIST, low and broad with only a small front face; right walls reach the adventurer's CHEST, modestly taller but still below the head. Never tall cliff walls. Put the full-body adventurer directly behind the short foreground wall so the visibility of the head and torso is clear, same pose and size in both mockups.
Below the rooms, show three enlarged isolated wall tile drawings of the SAME design (straight segment, corner block, naturally varied block) and the two matching small props described above, evenly spaced on the charcoal background. These are alternative game-art concepts for discussion, not a gameplay screenshot with UI.
Consistent crisp pixel edges and hand-painted pixel shading, fairly low detail density, clearly separated stone wall from floor, tightly controlled palette, attractive professional game art. No extra heroes, enemies, large towers, roof, busy vegetation, fake UI, watermarks, labels beyond the three specified strings, or dramatic lighting bloom.
```

完成した5枚で、文字・壁の形・低め／少し高めの比較・小物を目視確認済み。生成画像は加工せずPNGのまま保存。
