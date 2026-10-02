# 冒険者の旅立ち タイトル

第2案を実装。暖かい廃墟入口と遠景、青緑のマントの冒険者。ロゴ・背景は分離し、キャラクター選択・探索・遊び方・音ON/OFFをPhaserで描画。
歯車は背景にも操作要素にも含めない。PC/スマホ共通画風、スマホは冒険者側に背景を寄せる。

imagegen参照: exec-9b5c19ac-dce7-4d30-a725-060418f3e214.png（右上第2案）
背景: exec-35596a7f-9742-40fc-aad0-94995c17f854.png（UI文字や歯車なし、暖かな城と谷を望む廃墟入口）
透明ロゴ: exec-f8f0dbef-d594-4aac-b534-efaed5666aa6.png（ちゃりだんじょん、金文字と石と蔦）
public/assets/ui/departure-title-v1/ に圧縮WebPを格納。
死亡画面は exec-e6e4e8c7-80ab-453f-938a-68a1f2515645.png のイメージのみ。まだ実装しない。

npm run build、qa-explore-resume.cjs PC/スマホ、qa-startup-audio.cjsを確認。
