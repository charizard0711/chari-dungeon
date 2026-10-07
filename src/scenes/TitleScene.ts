import Phaser from 'phaser';

import { presentMenu } from '../menuPresentation';
import { addTitleLoop } from '../titleOpening';
import { GAME_W, GAME_H } from '../main';
import { Audio } from '../audio/manager';
import { readRunSave } from '../runSave';
import { DIFFICULTIES, DIFFICULTY_RULES, difficultyOf, isDifficultyUnlocked, readDifficultyProgress, selectDifficulty, type Difficulty } from '../difficulty';
import {
  getSelectedGender,
  isPlayerGender,
  playerFrameIndex,
  playerSheetKey,
  PlayerGender,
  setSelectedGender
} from '../playerAppearance';

const FONT = '"Yu Gothic UI", "Meiryo", sans-serif';

export class TitleScene extends Phaser.Scene {
  private selectedGender: PlayerGender = getSelectedGender();
  selectedDifficulty: Difficulty = 'normal';
  private titleAction?: () => void;
  private titleBack?: () => void;
  private initialStage: 'home' | 'mode' = 'home';

  constructor() {
    super('TitleScene');
  }

  create(data?: { menuStage?: 'mode' }) {
    this.initialStage = data?.menuStage ?? 'home';
    presentMenu(this);
    this.selectedDifficulty = readDifficultyProgress().selected;
    document.body.dataset.difficulty = this.selectedDifficulty;
    // ローカルQAだけを無音にする。通常プレイのサウンド設定には影響させない。
    const qaParams = new URLSearchParams(location.search);
    const qaGender = qaParams.get('qa-gender');
    if (location.hostname === 'localhost' && isPlayerGender(qaGender)) {
      this.selectedGender = qaGender;
    } else {
      this.selectedGender = getSelectedGender();
    }
    if (location.hostname === 'localhost' && qaParams.has('qa-silent')) {
      Audio.bgmOn = false;
      Audio.seOn = false;
    }
    Audio.playBgm('title');
    // タイトル表示中に探索BGMを先読み。入力を待たせず、再生時も同じ要求を共有する。
    Audio.preloadBgm('floor01');

    const savedRun = readRunSave();
    let starting = false;
    const startGame = (resume = false) => {
      if (starting) return;
      starting = true;
      if (!(location.hostname === 'localhost' && isPlayerGender(qaGender))) setSelectedGender(this.selectedGender);
      this.cameras.main.fadeOut(180, 2, 7, 8);
      this.time.delayedCall(190, () => this.scene.start('GameScene', { resume, difficulty: this.selectedDifficulty }));
    };

    let resumeDialog: Phaser.GameObjects.Container | undefined;
    const closeResumeDialog = () => {
      resumeDialog?.destroy(true);
      resumeDialog = undefined;
    };
    const requestExplore = () => {
      if (starting || resumeDialog) return;
      if (!savedRun) { startGame(false); return; }
      const previous = new Set(this.children.list);
      const w = Math.min(GAME_W - 24, 440);
      const y = GAME_H / 2;
      this.add.rectangle(GAME_W / 2, y, GAME_W, GAME_H, 0x020208, .82).setInteractive();
      this.add.rectangle(GAME_W / 2, y, w, 330, 0x130d15, 1).setStrokeStyle(2, 0xc89a50);
      this.add.text(GAME_W / 2, y - 122, '続きから探索しますか？', {
        fontFamily: FONT, fontSize: '22px', color: '#ffe1a0', fontStyle: 'bold'
      }).setOrigin(.5);
      const state = savedRun.snapshot.state;
      this.add.text(GAME_W / 2, y - 77, `${DIFFICULTY_RULES[difficultyOf(state.difficulty)].name} · ${state.floor}${state.inBossRoom ? '.5' : ''}階 · Lv.${savedRun.snapshot.player.level}`, {
        fontFamily: FONT, fontSize: '15px', color: '#d7c8b4'
      }).setOrigin(.5);
      this.makeButton(GAME_W / 2, y - 6, '続きから探索', () => startGame(true));
      let confirmNew = false;
      const newGame = this.add.text(GAME_W / 2, y + 64, `${DIFFICULTY_RULES[this.selectedDifficulty].name}で最初から始める`, {
        fontFamily: FONT, fontSize: '16px', color: '#d3c5b8', padding: { x: 18, y: 12 }
      }).setOrigin(.5).setInteractive({ useHandCursor: true });
      newGame.on('pointerdown', () => {
        if (confirmNew) startGame(false);
        else { confirmNew = true; newGame.setText('保存を上書きして始める（もう一度押す）').setFontSize('13px'); }
      });
      this.add.text(GAME_W / 2, y + 125, '戻る', {
        fontFamily: FONT, fontSize: '15px', color: '#c2a66f', padding: { x: 24, y: 12 }
      }).setOrigin(.5).setInteractive({ useHandCursor: true }).on('pointerdown', closeResumeDialog);
      const dialogChildren = this.children.list.filter(child => !previous.has(child));
      resumeDialog = this.add.container(0, 0, dialogChildren).setDepth(50);
    };
    this.createCinematicTitle(requestExplore, () => {
      if (!starting && !resumeDialog) {
        setSelectedGender(this.selectedGender); Audio.playSe('click'); this.scene.start('HalloweenScene');
      }
    });

    const exploreKey = (event: KeyboardEvent) => { event.preventDefault(); if (this.input.enabled && !resumeDialog) this.titleAction?.(); };
    this.input.keyboard?.on('keydown-ENTER', exploreKey);
    this.input.keyboard?.on('keydown-SPACE', exploreKey);
    const backKey = () => { if (!this.input.enabled) return; if (resumeDialog) closeResumeDialog(); else this.titleBack?.(); };
    this.input.keyboard?.on('keydown-ESC', backKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ENTER', exploreKey);
      this.input.keyboard?.off('keydown-SPACE', exploreKey);
      this.input.keyboard?.off('keydown-ESC', backKey);
    });
    if (location.hostname === 'localhost' && qaParams.has('qa-game')) {
      this.time.delayedCall(80, () => startGame(qaParams.has('qa-resume')));
    }
  }

  private createCinematicTitle(explore: () => void, event: () => void) {
    const mobile = GAME_W < 700, cx = GAME_W / 2;
    addTitleLoop(this);
    this.add.rectangle(cx,GAME_H/2,GAME_W,GAME_H,0x061014,mobile?.16:.04);
    this.add.rectangle(cx,GAME_H-100,GAME_W,200,0x030b10,.20);
    const logo = this.add.image(cx,mobile?280:260,'title_golden_crossed_swords').setName('title-logo');
    this.textures.get('title_golden_crossed_swords').setFilter(Phaser.Textures.FilterMode.LINEAR);
    for(let i=0;i<24;i++) {
      const mote=this.add.circle(Math.random()*GAME_W,Math.random()*GAME_H,Math.random()*1.8+.6,0xffffff,.25+Math.random()*.4);
      this.tweens.add({targets:mote,x:mote.x+18,y:mote.y-55,alpha:0,duration:5000+Math.random()*5000,repeat:-1,delay:Math.random()*4000});
    }
    for(let i=0;i<12;i++) {
      const x=Math.random()*GAME_W,y=180+Math.random()*(GAME_H-250);
      const glint=this.add.graphics().setPosition(x,y).setAlpha(0);
      glint.fillStyle(0xffffff,.9).fillPoints([{x:0,y:-5},{x:1,y:-1},{x:5,y:0},{x:1,y:1},{x:0,y:5},{x:-1,y:1},{x:-5,y:0},{x:-1,y:-1}],true);
      this.tweens.add({targets:glint,alpha:.65,y:y-20,duration:2200+Math.random()*1800,yoyo:true,repeat:-1,delay:Math.random()*4000,ease:'Sine.inOut'});
    }
    let panel: Phaser.GameObjects.Container | undefined;
    const help=this.createHelpOverlay();
    let stage:'home'|'mode'|'dungeon'|'event'='home';
    const text=(x:number,y:number,label:string,size:number,color='#eee7d6')=>this.add.text(x,y,label,{fontFamily:FONT,fontSize:`${size}px`,color,align:'center',letterSpacing:1}).setOrigin(.5).setShadow(0,2,'#10232c',4,true,true);
    const choice=(y:number,label:string,sub:string,name:string,action:()=>void)=>{
      const width=mobile?GAME_W-44:520;
      const plate=this.add.image(cx,y,'title-menu-frame').setDisplaySize(width,116);
      const arrow=text(cx+width/2-26,y,'›',28,'#c5dace');
      const line=text(cx,y,label,mobile?20:23);
      text(cx,y+39,sub,mobile?10:12,'#a5b8ba');
      this.add.zone(cx,y,width,70).setName(name).setInteractive({useHandCursor:true})
        .on('pointerover',()=>{
          if(mobile)return;
          plate.setTint(0xc6f5ff);line.setColor('#ffe1a0');
          this.tweens.killTweensOf([line,arrow]);
          this.tweens.add({targets:line,x:cx+5,scale:1.08,duration:140});
          this.tweens.add({targets:arrow,x:cx+width/2-21,duration:140});
        })
        .on('pointerout',()=>{
          if(mobile)return;
          this.tweens.killTweensOf([line,arrow]);
          plate.clearTint();line.setColor('#eee7d6').setScale(1);line.x=cx;arrow.x=cx+width/2-26;
        })
        .on('pointerdown',()=>{Audio.playSe('click');action()});
    };
    const render=(next:typeof stage)=>{
      stage=next;panel?.destroy(true);
      const previous=new Set(this.children.list);
      const home=stage==='home';
      logo.setPosition(cx,home?(mobile?285:270):(mobile?130:120));
      logo.setScale(Math.min((mobile?GAME_W-35:home?760:410)/logo.width,(home?mobile?260:350:170)/logo.height));
      if(home) {
        text(cx,mobile?454:464,'忘却の迷宮、その先へ。',mobile?13:17,'#c5d6d3');
        this.add.rectangle(cx,mobile?589:580,mobile?240:300,74,0x10252c,.42).setStrokeStyle(1,0xe6d6a6,.55);
        const prompt=text(cx,mobile?589:580,'START',mobile?28:32,'#fff0c7');
        this.tweens.add({targets:prompt,alpha:.45,duration:1500,yoyo:true,repeat:-1});
        this.add.rectangle(cx,mobile?625:618,mobile?180:240,1,0xd4bb79,.65);
        this.add.zone(cx,mobile?589:580,300,90).setName('title-start').setInteractive({useHandCursor:true}).on('pointerdown',()=>render('mode'));
        text(cx,mobile?656:658,'クリック / ENTER で冒険を始める',11,'#a9b9b8');
        this.titleAction=()=>render('mode');this.titleBack=()=>{};
      } else {
        this.add.rectangle(cx,mobile?458:437,mobile?GAME_W-20:650,mobile?500:475,0x071b25,.72).setStrokeStyle(1,0xd6c798,.45);
        text(cx,mobile?250:234,stage==='mode'?'冒険を選ぶ':stage==='dungeon'?'ダンジョンへ':'季節の冒険へ',mobile?24:28,'#e8cf99');
        text(cx,mobile?280:268,stage==='mode'?'あなたの次の物語は、どこから。':'冒険者を選び、出発しよう。',12,'#a5b8ba');
        if(stage==='mode') {
          choice(mobile?369:355,'ダンジョン','30階層の迷宮に挑む','title-dungeon',()=>render('dungeon'));
          choice(mobile?468:454,'イベント','ハロウィン ─ 呪われた収穫城','halloween-event',()=>render('event'));
          this.titleAction=()=>render('dungeon');
        } else {
          this.createGenderSelector(mobile?373:357,mobile);
          if(stage==='dungeon') this.createDifficultySelector(mobile?534:510,mobile);
          else text(cx,mobile?502:490,'5層の冒険 · 武器と服を選んでレベル1から',mobile?11:15,'#cdb996');
          choice(mobile?638:613,stage==='dungeon'?'探索へ':'装備を選んで出発','',stage==='dungeon'?'title-explore':'title-event-prepare',stage==='dungeon'?explore:event);
          this.titleAction=stage==='dungeon'?explore:event;
        }
        const backY=mobile?736:703;
        const goBack=()=>render(stage==='mode'?'home':'mode');
        this.add.image(cx,backY,'title-menu-frame').setDisplaySize(180,70);
        text(cx,backY,'‹ 戻る',14,'#eee2bc');
        this.add.zone(cx,backY,190,52).setName('title-back').setInteractive({useHandCursor:true}).on('pointerdown',goBack);
        this.titleBack=goBack;
      }
      panel=this.add.container(0,0,this.children.list.filter(c=>!previous.has(c))).setName('title-menu-panel');
      panel.setAlpha(0);this.tweens.add({targets:panel,alpha:1,duration:280,ease:'Sine.out'});
    };
    render(this.initialStage);
    text(mobile?50:70,GAME_H-27,'遊び方',12,'#d6d1bc').setInteractive({useHandCursor:true}).on('pointerdown',()=>help.setVisible(true));
    const sound=text(GAME_W-(mobile?45:70),GAME_H-27,'',22,'#d6d1bc').setPadding(8).setInteractive({useHandCursor:true});
    const refresh=()=>sound.setText(Audio.bgmOn||Audio.seOn?'🔊':'🔇');
    sound.on('pointerdown',()=>{const on=!(Audio.bgmOn||Audio.seOn);if(Audio.bgmOn!==on)Audio.toggleBgm();if(Audio.seOn!==on)Audio.toggleSe();refresh()});refresh();
    text(cx,GAME_H-27,'CHARI DUNGEON',10,'#7e9696');
  }

  private createArtworkTitle(startGame: () => void) {
    const mobile = GAME_W < 700;
    const cx = GAME_W / 2;
    const backdrop = this.add.image(cx, GAME_H / 2, 'title_map_background');
    if (mobile) backdrop.setScale(Math.max(GAME_W / backdrop.width, GAME_H / backdrop.height));
    else backdrop.setDisplaySize(GAME_W, GAME_H);
    if (mobile) this.add.rectangle(cx, GAME_H / 2, GAME_W, GAME_H, 0x100c08, .3);
    this.textures.get('title_golden_crossed_swords').setFilter(Phaser.Textures.FilterMode.LINEAR);
    const logo = this.add.image(cx, mobile ? 242 : 182, 'title_golden_crossed_swords').setName('title-logo');
    // The crossed blades are taller than the old wordmark; keep them clear of the character selector.
    logo.setScale(Math.min((mobile ? GAME_W - 32 : GAME_W * .5) / logo.width, (mobile ? 190 : 300) / logo.height));
    // Anchor the action to the frame painted into the backdrop, including its mobile crop.
    const exploreX = backdrop.x + (0.497 - .5) * backdrop.displayWidth;
    const exploreY = backdrop.y + (0.794 - .5) * backdrop.displayHeight;
    this.createGenderSelector(mobile ? 414 : 412, mobile);
    this.createDifficultySelector(mobile ? 547 : 529, mobile, mobile ? undefined : exploreY + backdrop.displayHeight * .09);
    {
      const x = exploreX, y = exploreY, w = Math.min(GAME_W - 32, backdrop.displayWidth * .36), h = backdrop.displayHeight * .08;
      this.add.text(x, y, '探索', { fontFamily: FONT, fontSize: mobile ? '27px' : '34px', color: '#f6d688', fontStyle: 'bold' }).setOrigin(.5);
      const hover = this.add.graphics();
      const clear = () => hover.clear();
      this.add.zone(x, y, w, h).setInteractive({useHandCursor:true})
        .on('pointerover', () => { hover.lineStyle(1, 0xffdfa1, .65).strokeRoundedRect(x-w/2, y-h/2, w, h, 12); })
        .on('pointerout', clear)
        .on('pointerdown', () => { Audio.playSe('click'); startGame(); })
        .on('pointerup', startGame);
    }
    const help = this.createHelpOverlay();
    this.add.text(GAME_W / 2, mobile ? GAME_H * .91 : GAME_H * .925, '遊び方', {
      fontFamily: FONT, fontSize: '16px', color: '#ffe0a0', fontStyle: 'bold', padding: { x: 20, y: 8 }
    }).setOrigin(.5).setStroke('#0c090e', 2).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { Audio.playSe('click'); help.setVisible(true); });
    const sound = this.add.text(GAME_W - 24, GAME_H - 30, '', {
      fontFamily: FONT, fontSize: '22px', color: '#ffe0a0', backgroundColor: '#21151de0', padding: { x: 12, y: 10 }
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true });
    const refreshSound = () => sound.setText(Audio.bgmOn || Audio.seOn ? '🔊' : '🔇');
    sound.on('pointerdown', () => {
      const enable = !(Audio.bgmOn || Audio.seOn);
      if (Audio.bgmOn !== enable) Audio.toggleBgm();
      if (Audio.seOn !== enable) Audio.toggleSe();
      if (enable) Audio.playSe('click');
      refreshSound();
    });
    refreshSound();
  }

  private createMobileTitle(startGame: () => void) {
    if (this.textures.exists('dungeon_chamber')) {
      const bg = this.add.image(GAME_W / 2, GAME_H / 2, 'dungeon_chamber');
      bg.setScale(Math.max(GAME_W / bg.width, GAME_H / bg.height)).setTint(0x8fb8b7);
    } else {
      this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x031012);
    }

    const shade = this.add.graphics();
    shade.fillStyle(0x020708, 0.62).fillRect(0, 0, GAME_W, GAME_H);
    shade.fillStyle(0x06333a, 0.28).fillCircle(GAME_W / 2, 410, 235);

    const logoY = 248;
    const logo = this.add.container(GAME_W / 2, logoY);
    if (this.textures.exists('logo')) {
      const image = this.add.image(0, 0, 'logo');
      image.setScale(Math.min(1, (GAME_W - 24) / image.width));
      logo.add(image);
    } else {
      logo.add(this.add.text(0, 0, 'ちゃりだんじょん', {
        fontFamily: FONT,
        fontSize: '48px',
        color: '#f4f1e8',
        fontStyle: 'bold'
      }).setOrigin(0.5).setStroke('#071619', 9));
    }
    this.tweens.add({ targets: logo, y: logoY - 6, yoyo: true, repeat: -1, duration: 2300, ease: 'Sine.inOut' });

    this.add.text(GAME_W / 2, 374, '30階層・ターン制ローグライク', {
      fontFamily: FONT,
      fontSize: '14px',
      color: '#e7b85e',
      fontStyle: 'bold',
      letterSpacing: 1
    }).setOrigin(0.5);

    this.createGenderSelector(468, true);
    this.makeButton(GAME_W / 2, 600, '探索', startGame);
    const help = this.createHelpOverlay();
    this.add.text(GAME_W / 2, 678, '遊び方', {
      fontFamily: FONT,
      fontSize: '15px',
      color: '#d5c08b',
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { Audio.playSe('click'); help.setVisible(true); });
    this.add.text(GAME_W / 2, GAME_H - 42, '30Fの守護者を倒し、忘却の迷宮を踏破せよ', {
      fontFamily: FONT,
      fontSize: '12px',
      color: '#91a6a7'
    }).setOrigin(0.5);
  }

  private createDifficultySelector(y: number, mobile: boolean, descriptionY = y + 50) {
    const progress = readDifficultyProgress();
    const width = mobile ? 112 : 150, gap = mobile ? 8 : 12, cx = GAME_W / 2;
    this.add.text(cx, y - 51, '難易度を選ぶ', { fontFamily: FONT, fontSize: '14px', color: '#e6d7b8', fontStyle: 'bold' }).setOrigin(.5).setStroke('#030711', 4);
    const description = this.add.text(cx, descriptionY, '', { fontFamily: FONT, fontSize: mobile ? '10px' : '12px', color: '#e0d6c3', align: 'center' }).setOrigin(.5).setStroke('#030711', 3);
    const cards: { mode: Difficulty; bg: Phaser.GameObjects.Graphics; x: number; title: Phaser.GameObjects.Text; status: Phaser.GameObjects.Text }[] = [];
    const refresh = () => {
      for (const card of cards) {
        const selected = card.mode === this.selectedDifficulty, rule = DIFFICULTY_RULES[card.mode];
        const unlocked = isDifficultyUnlocked(card.mode, progress);
        card.bg.clear().fillStyle(selected ? rule.color : 0x070d17, .98).fillRoundedRect(card.x - width / 2, y - 30, width, 60, 7)
          .lineStyle(selected ? 3 : card.mode !== 'normal' ? 2 : 1, selected ? 0xfff1c4 : rule.color, selected ? 1 : card.mode === 'normal' ? .65 : .9)
          .strokeRoundedRect(card.x - width / 2, y - 30, width, 60, 7);
        card.title.setColor(selected ? '#101923' : unlocked ? rule.text : '#87919d');
        card.status.setText(selected ? '✓ 選択中' : !unlocked ? `${card.mode === 'hard' ? 'ノーマル' : 'ハード'}クリアで解放` : progress.cleared.includes(card.mode) ? '★ CLEAR' : '選択する')
          .setColor(selected ? '#101923' : unlocked ? '#d5cbbb' : '#9aa3ad')
          .setFontSize(selected ? '12px' : '10px').setFontStyle(selected ? 'bold' : 'normal');
      }
      const mode = this.selectedDifficulty;
      description.setText(mode === 'normal' ? progress.cleared.includes('normal') ? '踏破済み / ハードに挑戦できます' : '30階踏破でハードを解放' : mode === 'hard'
        ? '敵HP ×1.25 / 攻撃 ×1.2 / 獲得G 70% / 復活1回'
        : '敵HP ×1.5 / 攻撃 ×1.4 / 獲得G 50% / 復活なし');
      document.body.dataset.difficulty = mode;
    };
    DIFFICULTIES.forEach((mode, index) => {
      const x = cx + (index - 1) * (width + gap), unlocked = isDifficultyUnlocked(mode, progress), rule = DIFFICULTY_RULES[mode];
      const bg = this.add.graphics();
      const title = this.add.text(x, y - 10, `${unlocked ? '' : '🔒 '}${rule.name}`, { fontFamily: FONT, fontSize: mobile ? '17px' : '20px', fontStyle: 'bold' }).setOrigin(.5);
      const status = this.add.text(x, y + 16, '', { fontFamily: FONT, fontSize: '10px' }).setOrigin(.5);
      cards.push({ mode, bg, x, title, status });
      if (unlocked) this.add.zone(x, y, width, 60).setName(`difficulty-${mode}`).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.selectedDifficulty = mode; selectDifficulty(mode); Audio.playSe('click'); refresh();
      });
    });
    refresh();
  }

  private createHelpOverlay() {
    const overlay = this.add.container(0, 0).setDepth(20).setVisible(false);
    const dismiss = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x020708, 0.88)
      .setInteractive({ useHandCursor: true });
    const panelW = Math.min(GAME_W - 36, 620);
    const panelH = GAME_W < 700 ? 330 : 280;
    const panelX = GAME_W / 2 - panelW / 2;
    const panelY = GAME_H / 2 - panelH / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x071a1e, 0.98).fillRoundedRect(panelX, panelY, panelW, panelH, 18);
    panel.lineStyle(2, 0xe7b85e, 0.72).strokeRoundedRect(panelX, panelY, panelW, panelH, 18);
    const title = this.add.text(GAME_W / 2, panelY + 38, '遊び方', {
      fontFamily: FONT,
      fontSize: '22px',
      color: '#ffe09a',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    const guide = [
      '移動　矢印キー / スティック',
      '加速　方向キー / スティックを長押し',
      '戦闘　敵へ進むと通常攻撃',
      '道具　アイテム欄からクリック / タップ'
    ].join('\n\n');
    const copy = this.add.text(GAME_W / 2, panelY + 86, guide, {
      fontFamily: FONT,
      fontSize: GAME_W < 700 ? '14px' : '16px',
      color: '#dce7e6',
      align: 'left',
      lineSpacing: 4
    }).setOrigin(0.5, 0);
    const close = this.add.text(GAME_W / 2, panelY + panelH - 34, 'タップして閉じる', {
      fontFamily: FONT,
      fontSize: '12px',
      color: '#78999b'
    }).setOrigin(0.5);
    dismiss.on('pointerdown', () => overlay.setVisible(false));
    overlay.add([dismiss, panel, title, copy, close]);
    return overlay;
  }

  private createGenderSelector(y: number, compact = false) {
    const cardW = compact ? 116 : 126;
    const cardH = compact ? 96 : 104;
    const gap = compact ? 10 : 16;
    const centerOffset = (cardW + gap) / 2;
    const cards: {
      gender: PlayerGender;
      container: Phaser.GameObjects.Container;
      background: Phaser.GameObjects.Graphics;
      portrait: Phaser.GameObjects.Image;
      label: Phaser.GameObjects.Text;
    }[] = [];

    this.add.text(GAME_W / 2, y - cardH / 2 - 20, '冒険者を選ぶ', {
      fontFamily: FONT,
      fontSize: compact ? '13px' : '14px',
      color: '#d5c08b',
      fontStyle: 'bold',
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(4).setStroke('#020708', 4);

    const refresh = () => {
      for (const card of cards) {
        if (!card.container.active) continue;
        const selected = card.gender === this.selectedGender;
        card.background.clear();
        card.background.fillStyle(selected ? 0x224b56 : 0x0b202a, .98)
          .fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
        card.background.lineStyle(selected ? 3 : 1, selected ? 0x9ce4e6 : 0x729299, selected ? 1 : 0.6)
          .strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
        if (selected) {
          card.background.fillStyle(0x16373e, 1)
            .fillRoundedRect(-cardW / 2 + 3, cardH / 2 - 26, cardW - 6, 23, 5);
        }
        const label = card.gender === 'male' ? '男性' : '女性';
        card.label.setText(selected ? `✓ ${label} 選択中` : label)
          .setFontSize(selected ? compact ? '11px' : '12px' : compact ? '13px' : '14px')
          .setColor(selected ? '#dffff2' : '#c2b8a6');
        card.portrait.setAlpha(selected ? 1 : 0.72);
        this.tweens.add({ targets: card.container, scale: selected ? 1.04 : 1, duration: 120, ease: 'Quad.easeOut' });
      }
    };

    const choose = (gender: PlayerGender) => {
      if (this.selectedGender === gender) return;
      this.selectedGender = gender;
      setSelectedGender(gender);
      Audio.playSe('click');
      refresh();
    };

    const options: { gender: PlayerGender; label: string; x: number }[] = [
      { gender: 'male', label: '男性', x: GAME_W / 2 - centerOffset },
      { gender: 'female', label: '女性', x: GAME_W / 2 + centerOffset }
    ];
    for (const option of options) {
      const container = this.add.container(option.x, y).setDepth(4);
      const background = this.add.graphics();
      const portrait = this.add.image(
        0,
        -10,
        playerSheetKey(option.gender),
        playerFrameIndex('down', 'idle')
      );
      // The sprite includes transparent padding; keep the painted figure inside the card and above its label.
      portrait.setScale(Math.min((cardW - 20) / portrait.width, compact ? .9 : 1));
      const label = this.add.text(0, cardH / 2 - 13, option.label, {
        fontFamily: FONT,
        fontSize: compact ? '13px' : '14px',
        color: '#f4dfaa',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      container.add([background, portrait, label]);
      container.setSize(cardW, cardH).setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => choose(option.gender));
      cards.push({ gender: option.gender, container, background, portrait, label });
    }

    const chooseMale = () => choose('male');
    const chooseFemale = () => choose('female');
    this.input.keyboard?.on('keydown-LEFT', chooseMale);
    this.input.keyboard?.on('keydown-RIGHT', chooseFemale);
    cards[0]?.container.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.input.keyboard?.off('keydown-LEFT', chooseMale);
      this.input.keyboard?.off('keydown-RIGHT', chooseFemale);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-LEFT', chooseMale);
      this.input.keyboard?.off('keydown-RIGHT', chooseFemale);
    });
    refresh();
  }

  makeButton(x: number, y: number, label: string, onClick: () => void) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    const w = GAME_W < 700 ? Math.min(350, GAME_W - 56) : 330;
    const h = 68;
    const draw = (hover = false) => {
      bg.clear();
      bg.fillStyle(0x2a1720, 0.98).fillRoundedRect(-w / 2, -h / 2, w, h, 12);
      bg.lineStyle(2, hover ? 0xffdf9f : 0xe7b85e, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
      bg.fillStyle(hover ? 0xe7b85e : 0xe7b85e, hover ? 0.12 : 0.06).fillRoundedRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 8);
    };
    draw();
    const text = this.add.text(0, 0, label, {
      fontFamily: FONT,
      fontSize: '22px',
      color: '#ffe1a0',
      fontStyle: 'bold',
      letterSpacing: 1
    }).setOrigin(0.5);
    container.add([bg, text]);
    // Containerの既定ヒット領域を使い、表示サイズとタップ領域を一致させる。
    container.setSize(w + 28, h + 20).setInteractive({ useHandCursor: true });
    container.on('pointerover', () => { draw(true); this.tweens.add({ targets: container, scale: 1.035, duration: 120 }); });
    container.on('pointerout', () => { draw(false); this.tweens.add({ targets: container, scale: 1, duration: 120 }); });
    container.on('pointerdown', () => {
      this.tweens.add({ targets: container, scale: 0.985, duration: 45 });
      Audio.playSe('click');
      onClick();
    });
    // 一部タッチ環境でdownが取りこぼされた場合もupで補完する（開始処理側で二重実行を防止）。
    container.on('pointerup', onClick);
    return container;
  }
}



