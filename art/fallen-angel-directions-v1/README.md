# 16階・黒翼の堕天使

使用モード: built-in image_gen（新規作画、実アルファ透過）。

## 保存先

- ゲーム用4方向: `C:/chari-dungeon-release-final/public/assets/monsters/directional/fallen-angel-directions-v1.png` — 256×256 RGBA、93,742 bytes。
- ベース画像: `C:/chari-dungeon-release-final/public/assets/monsters/m_fallen_angel.png` — 前面セル128×128。
- 生成元: `C:\Users\masam\.codex\generated_images\01a08ed5-5e3c-77a0-8ea5-a1e27ef7525c\exec-50e2caf1-9b47-4043-8920-5fd6201f908e.png`
- スタイル参照: `C:/chari-dungeon-release-final/public/assets/monsters/directional/seraph-directions-v1.png`

## 実装

16階だけを `m_fallen_angel` に差し替え。闇属性、追尾・剣撃、紫の予告範囲への転移衝撃。HP・攻撃力・防御力・報酬の基礎値は元の16階ボスを維持。
4枚は左上=下、右上=左、左下=右、右下=上／背面。共通の固定サイズ、控えめな揺れ、116msの補間移動・攻撃を使用。
転移直後の攻撃モーションが旧座標へ戻る問題を修正し、転移先を基準に動かす。共通処理を使う12階の闇竜も同じ修正を適用。

## 検証

- `npm run build` 成功。
- `scripts/qa-custom-floor-bosses.cjs`: 16階の専用出現・闇属性・攻撃対応・属性表示・他階層維持。
- `scripts/qa-movement-input.mjs`: 全17種の4方向・サイズ固定・入力応答・攻撃タイミング。闇竜と堕天使の転移後にスプライトが正しい座標に残ることを検証。
- ブラウザーの16階で20ms短押し2回→2行動・処理完了・予約なしを確認。
- 4方向の絵と実際の16階画面を目視確認。

## 最終生成プロンプト

Use case: stylized-concept. Asset type: fantasy dungeon RPG four-direction sprite sheet. Reference image is the existing game's rich pixel-illustration touch, compact sprite proportions and FOUR-view layout only. Create a NEW FALLEN ANGEL boss with two great BLACK FEATHERED wings, clearly a winged humanoid rather than a dragon or horned demon. An imposing adult male angel with long silver-white hair, a stern pale face, blackened steel full breastplate and layered dark greaves, silver edge highlights and subtle amethyst fittings, a long charcoal tattered waist tabard, armored boots. One dark straight longsword in the anatomical RIGHT hand, blade held low, narrow purple edge. No spear. The wings have raven-black feathers with blue-violet and silver rim highlights so readable against a dark dungeon; feather tips slightly ragged. No bat wing membranes, dragon head/tail, extra arms, horns, skull head or fire. Draw unique face and armor, not a color swap of the reference. Exactly FOUR complete drawings of the SAME character in a strict 2x2 SQUARE sheet: TOP LEFT down/front; TOP RIGHT left-facing side profile; BOTTOM LEFT right-facing side profile; BOTTOM RIGHT up/TRUE BACK view with back of hair, rear armor and wings, no face visible. Same body size and feet baseline in all cells, calm standing ready pose only, no extra animation frames. Entire wings, hair, sword, feet inside each equal square quadrant, generous 12% margins and clear gutters. Crisp stepped outlines, elaborate layered highlights and shaded pixel clusters, readable small RPG silhouette matching reference. Transparent background with real PNG alpha. No ground shadow, floor, text, labels, grid lines, scene, minions, particles or sweeping aura.

## パッキング

`scripts/prepare-monster-directions.cjs` で透過を保持し、4方向を共通倍率で128pxセルへ縮小・配置。背景削除などの手描き代替処理は行っていない。
