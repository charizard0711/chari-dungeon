import Phaser from 'phaser';
import { GAME_W, GAME_H } from './layout';
let large=false;
let menuScene: Phaser.Scene | undefined;
let game: Phaser.Game | undefined;
let buttons: HTMLButtonElement[]=[];
function applySize() {
  if(!game)return;
  document.body.dataset.screenSize=large?'large':'small';
  const parent=document.getElementById('game-container')!;
  const fullscreenMenu=large&&menuScene?.sys.isActive();
  if(fullscreenMenu)document.body.dataset.presentation='menu';
  else delete document.body.dataset.presentation;
  const scale=game.scale;
  if(large){parent.style.width='100vw';parent.style.height='100dvh';}
  else {
    const zoom=Math.min(1,window.innerWidth/GAME_W,window.innerHeight/GAME_H);
    parent.style.width=`${GAME_W*zoom}px`;parent.style.height=`${GAME_H*zoom}px`;
  }
  scale.scaleMode=fullscreenMenu?Phaser.Scale.RESIZE:Phaser.Scale.FIT;
  scale.displaySize.setAspectMode(fullscreenMenu?Phaser.Structs.Size.NONE:Phaser.Structs.Size.FIT);
  scale.getParentBounds();
  if(fullscreenMenu)scale.resize(window.innerWidth,window.innerHeight);
  else scale.setGameSize(GAME_W,GAME_H);
  scale.refresh();
  buttons.forEach(b=>{const chosen=(b.dataset.size==='large')===large;b.setAttribute('aria-pressed',String(chosen));});
}
export function installScreenSizeControls(instance: Phaser.Game) {
  game=instance;
  const controls=document.createElement('div');controls.id='screen-size-controls';controls.setAttribute('aria-label','画面サイズ');
  const label=document.createElement('span');label.textContent='画面';controls.append(label);
  for(const [value,title]of[['small','小'],['large','大']]) {
    const button=document.createElement('button');button.type='button';button.textContent=title;button.dataset.size=value;
    button.setAttribute('aria-pressed',String(value==='small'));
    button.addEventListener('click',()=>{large=value==='large';applySize()});controls.append(button);buttons.push(button);
  }
  document.body.append(controls);window.addEventListener('resize',applySize);
}
export function presentMenu(scene: Phaser.Scene) {
  menuScene=scene;game=scene.game;applySize();
  const fit=()=>{
    const camera=scene.cameras.main;
    camera.setViewport(0,0,scene.scale.width,scene.scale.height);
    camera.setZoom(Math.min(scene.scale.width/GAME_W,scene.scale.height/GAME_H));
    camera.centerOn(GAME_W/2,GAME_H/2);
  };
  fit();scene.scale.on('resize',fit);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{scene.scale.off('resize',fit);if(menuScene===scene)menuScene=undefined;});
}
export function presentGame(scene: Phaser.Scene) {
  menuScene=undefined;game=scene.game;applySize();
}
export function menuBackdrop(scene: Phaser.Scene,key:string) {
  const image=scene.add.image(GAME_W/2,GAME_H/2,key);
  const fit=()=>{
    const zoom=Math.min(scene.scale.width/GAME_W,scene.scale.height/GAME_H);
    image.setScale(Math.max(scene.scale.width/zoom/image.width,scene.scale.height/zoom/image.height)*1.04);
  };
  fit();scene.scale.on('resize',fit);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.scale.off('resize',fit));
  scene.tweens.add({targets:image,x:GAME_W/2+8,y:GAME_H/2-5,duration:14000,yoyo:true,repeat:-1,ease:'Sine.inOut'});
  return image;
}
