import { translate } from './i18n';
import Phaser from 'phaser';
import { GAME_W, GAME_H, IS_MOBILE } from './layout';
let game: Phaser.Game | undefined;
let large = false;
const sizeButtons: HTMLButtonElement[] = [];
function applySize() {
  if(!game)return;
  const parent=document.getElementById('game-container')!;
  const scale=game.scale;
  const zoom=Math.min(large && !IS_MOBILE ? Infinity : 1,window.innerWidth/GAME_W,window.innerHeight/GAME_H);
  parent.style.width=`${GAME_W*zoom}px`;parent.style.height=`${GAME_H*zoom}px`;
  scale.scaleMode=Phaser.Scale.FIT;
  scale.displaySize.setAspectMode(Phaser.Structs.Size.FIT);
  scale.getParentBounds();
  scale.setGameSize(GAME_W,GAME_H);
  scale.refresh();
  sizeButtons.forEach(button => button.setAttribute('aria-pressed', String((button.dataset.size === 'large') === large)));
}
export function installScreenSizing(instance: Phaser.Game) {
  game=instance;
  if (!IS_MOBILE) {
    const controls = document.createElement('div');
    controls.id = 'screen-size-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', '画面サイズ');
    const label = document.createElement('span');
    label.textContent = translate('画面');
    window.addEventListener('chari-language-changed', () => {
      label.textContent = translate('画面');
      sizeButtons.forEach(button => { button.textContent = translate(button.dataset.size === 'large' ? '大' : '小'); });
      controls.setAttribute('aria-label', translate('画面サイズ'));
    });
    controls.append(label);
    for (const [value, title] of [['small', '小'], ['large', '大']]) {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = translate(title); button.dataset.size = value;
      button.addEventListener('click', () => { large = value === 'large'; applySize(); button.blur(); });
      controls.append(button); sizeButtons.push(button);
    }
    document.body.append(controls);
  }
  applySize();
  window.addEventListener('resize',applySize);
}
export function presentMenu(scene: Phaser.Scene) {
  game=scene.game;applySize();
  const fit=()=>{
    const camera=scene.cameras.main;
    camera.setViewport(0,0,scene.scale.width,scene.scale.height);
    camera.setZoom(Math.min(scene.scale.width/GAME_W,scene.scale.height/GAME_H));
    camera.centerOn(GAME_W/2,GAME_H/2);
  };
  fit();scene.scale.on('resize',fit);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{scene.scale.off('resize',fit);});
}
export function presentGame(scene: Phaser.Scene) {
  game=scene.game;applySize();
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
