# 羊皮紙の耐久警告

内蔵 image_gen で選択済みの第3案から武器・盾を個別に抽出し、背景を透過。

元案: art/durability-warning-concepts-v1/03-parchment-notice.png

ゲーム用素材:
- public/assets/ui/durability-warning-v1/weapon.png
- public/assets/ui/durability-warning-v1/shield.png

## weapon

Use case: background-extraction / precise-object-edit.
Input image 1 is the EDIT TARGET: the approved parchment warning design sheet for a Japanese fantasy dungeon game.
Extract only the indicated warning banner and prepare it as one clean production-ready UI sprite. Preserve the selected original artwork very faithfully: cracked equipment, burgundy fabric, small hammer, brown leather backing, antique brass pin, caution seal, aged parchment and exact Japanese typography. Keep its warm antique colors and proportions. Keep the entire selected banner and protruding artwork visible with modest transparent padding.
Remove the dark presentation background COMPLETELY to genuine alpha transparency, remove the heading and every other warning example. No contact sheet, no caption, no new objects, no checkerboard painted into the image, no outer square/card. Single centered horizontal banner only, wide landscape composition. Preserve existing shadows only immediately around the banner.
Extract the TOP sword warning ONLY, with its exact text 「武器が壊れそう！」. No shield artwork or shield message. Keep the sword intact but cracked, just like the source.

## shield

Use case: background-extraction / precise-object-edit.
Input image 1 is the EDIT TARGET: the approved parchment warning design sheet for a Japanese fantasy dungeon game.
Extract only the indicated warning banner and prepare it as one clean production-ready UI sprite. Preserve the selected original artwork very faithfully: cracked equipment, burgundy fabric, small hammer, brown leather backing, antique brass pin, caution seal, aged parchment and exact Japanese typography. Keep its warm antique colors and proportions. Keep the entire selected banner and protruding artwork visible with modest transparent padding.
Remove the dark presentation background COMPLETELY to genuine alpha transparency, remove the heading and every other warning example. No contact sheet, no caption, no new objects, no checkerboard painted into the image, no outer square/card. Single centered horizontal banner only, wide landscape composition. Preserve existing shadows only immediately around the banner.
Extract the BOTTOM shield warning ONLY, with its exact text 「盾が壊れそう！」. No sword artwork or weapon message.
