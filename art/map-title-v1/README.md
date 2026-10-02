# 宝地図のスタート画面

添付 codex-clipboard-e7ae07bd-5b86-4f72-ae03-76732a440c34.png を参照し背景をimagegenで作成。元画像の宝地図、革の本、コンパス、蝋燭、巻物、タイトル額縁、探索の枠を保持。文字、人物カード、番号、歯車は画像から除去し実際のUIを重ねる。
背景元: exec-b9032c91-3bc2-45e5-a8e0-243df3339f5e.png
タイトル元: exec-e12d59f1-4fd1-46a0-b69e-32dd49a4a3f4.png
タイトルは「ちゃりだんじょん」だけの控えめな金色ドット絵、透明背景。余白を除きWebPに圧縮。PhaserはタイトルだけNEARESTで表示、その他の絵は既存の滑らかな表示。
実装: public/assets/ui/map-title-v1/、TitleScene、BootScene。
PC/スマホ、再開の確認、キャンセル、再開、新規開始、ビルドを確認。ローディングの歩く子は変更しない。
