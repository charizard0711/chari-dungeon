# 手描きの冒険者 v1

2026-09-14。承認された `reference.png` の、自然な顔・黒髪・控えめな陰影・手描きの輪郭をゲーム用に展開。

男性・女性それぞれに革装、鎖帷子、板金鎧、秘術装甲、竜鱗神鎧の5種類。1着につき4方向×16コマ、計640コマ。武器と盾は別画像を重ね、装備の組み合わせを増やしてもキャラ画像は増やさない。

## 保存場所とプレビュー

- 実行用画像：`C:/chari-dungeon-release-final/public/assets/characters/player-painted-v1/`（10枚）
- 元絵・生成指示・切り出し情報：このフォルダー
- [男女・服・歩行・攻撃のプレビュー](http://localhost:5173/qa/player-painted.html)
- [実ゲーム・1階](http://localhost:5173/?qa-game&qa-floor=1&qa-field-arena)
- [全装備の組み合わせ確認](http://localhost:5173/qa/equipment-appearance.html)

## 生成方法と指示

絵の生成と描き直しは組み込みの `image_gen` を使用。CLI/APIへの切り替えは行っていない。格子柄が画像に焼き込まれる問題があり、ユーザーの「背景だけ画像処理で透明にして進める」という明示的な許可を受け、背景除去・切り出し・サイズ調整・シートへの配置を Sharp で実施した。最終素材は白背景の元絵から作成している。

- [最初の男性用指示](male-leather.prompt.txt)
- [攻撃方向の修正指示](male-leather-correction.prompt.txt)
- [男性の白背景化](male-leather-white.prompt.txt)
- [女性・革装](female-leather-variant.prompt.txt)
- [男性・鎖帷子](male-chain-variant.prompt.txt)、[板金鎧](male-plate-variant.prompt.txt)、[秘術装甲](male-arcane-variant.prompt.txt)、[竜鱗神鎧](male-dragon-variant.prompt.txt)
- [女性・鎖帷子](female-chain-variant.prompt.txt)、[板金鎧](female-plate-variant.prompt.txt)、[秘術装甲](female-arcane-variant.prompt.txt)、[竜鱗神鎧](female-dragon-variant.prompt.txt)

使用する元絵は男性の革装だけ `male-leather-white.png`、残る9着は `{gender}-{armor}-source.png`。`male-leather-source.png`・`male-leather-corrected.png`・`female-leather-draft.png` は制作途中の資料で、ゲームには使用しない。

## 描画仕様

実行用シートは768×768、1コマ96×96。各方向が2行（16コマ）を使い、下・左・右・上の順。最初の行は待機2枚と歩行6枚、次の行は構え2枚・斬撃2枚・振り抜き・戻り・被弾・倒れる。

元絵の行間から切り出し境界を求め、隣の行の足や髪が混入しないようにする。足元は各コマで同じ高さ、左右の基準は各方向の静止姿勢に合わせる。`hand-points.json` の元絵上の手の座標を、各衣装の切り出し後の座標へ変換して `src/playerHandAnchors.ts` に保存。

`PlayerAnimation` は絵の切り替えだけを担当する。移動距離・ターン・キー入力の待ち時間には触れず、歩行の足運びは連続する移動間で引き継ぐ。左攻撃も専用の絵を使用。キャラを伸縮させる歩行・攻撃・待機アニメーションは廃止した。装備は常駐する2つのスプライトで描画し、実行中に画像を生成しない。

10シート合計の転送量は4.71MiB、展開後のテクスチャは22.5MiB。表示上の大きさは43.52ワールド単位のセルで統一。原画を残し、実ゲームで必要な解像度に調整した。

## 再生成

プロジェクト直下から以下を実行。画像生成自体は各 `.prompt.txt` と参照画像を組み込み画像生成ツールへ渡す。

```powershell
node scripts/prepare-player-painted.cjs male-leather art/player-painted-v1/male-leather-white.png white
node scripts/prepare-player-painted.cjs female-leather art/player-painted-v1/female-leather-source.png white
# 他の8着も同様に {gender}-{armor}-source.png を指定
node scripts/prepare-player-hand-anchors.cjs
```

## 確認

- `qa-player-animation.cjs`：64コマの索引、歩行位相の継続、攻撃・被弾・死亡の切り替え
- `qa-player-painted-assets.cjs`：640枚の描き分け、透過、コマ端の余白、ファイル容量
- `qa-equipment-renderer.cjs`：手への追従、方向ごとの前後関係、二刀流、脱着、非表示、オブジェクト再利用
- `qa-movement-input.mjs`：入力保持、長押し、短押し、既存の移動時間
- `qa-item-catalog.cjs`：装備一覧と取得の既存動作
- `npm run build`
- ブラウザー：全18,400組の装備・服・性別・方向を描画、画像欠損なし。1階女性の下→左、9階男性の下→下の短押しはいずれも2行動で停止。

2026-09-14：リコールベル・装備修復石の更新とあわせて公開サイトへのリリース対象。
