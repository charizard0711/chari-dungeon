import Phaser from 'phaser';
import { MAP_X, MAP_Y, MAP_W, MAP_H } from './layout';
import { equipmentIconTexture } from './artRefresh';
import { playerFrameIndex } from './playerAppearance';

/** Screen-space sequence, using the current painted character and equipment. */
export function playRevivalPresentation(scene: Phaser.Scene, player: Phaser.GameObjects.Image, weaponKey?: string): Promise<void> {
  return new Promise(resolve => {
    const root = scene.add.container(MAP_X, MAP_Y).setDepth(10000).setName('revival-presentation');
    const cx=MAP_W/2, cy=MAP_H/2;
    const shade=scene.add.rectangle(cx,cy,MAP_W,MAP_H,0x000000).setAlpha(0).setInteractive();
    const eyes=scene.add.graphics().setPosition(cx,cy-30).setAlpha(0);
    eyes.fillStyle(0x3bd6cd,.14);eyes.fillEllipse(-15,0,32,16);eyes.fillEllipse(15,0,32,16);
    eyes.fillStyle(0xe0fff7,1);eyes.fillPoints([{x:-28,y:-3},{x:-5,y:1},{x:-10,y:5},{x:-23,y:3}],true);
    eyes.fillPoints([{x:28,y:-3},{x:5,y:1},{x:10,y:5},{x:23,y:3}],true);
    const hero=scene.add.image(cx,cy+55,player.texture.key,playerFrameIndex('down','atk')).setDisplaySize(110,110).setAlpha(0);
    const weapon=weaponKey?scene.add.image(cx+28,cy+30,equipmentIconTexture(weaponKey)).setDisplaySize(75,75).setAngle(-45).setAlpha(0):undefined;
    const halo=scene.add.image(cx,cy+50,'fx_heal').setDisplaySize(155,155).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    root.add([shade,halo,hero,eyes,...(weapon?[weapon]:[])]);
    const label=scene.add.text(cx,cy+135,'復活のタネが芽吹いた',{fontFamily:'sans-serif',fontSize:'18px',color:'#cfffee'}).setOrigin(.5).setAlpha(0);
    root.add(label);
    scene.tweens.add({targets:shade,alpha:1,duration:280,ease:'Sine.out'});
    scene.tweens.add({targets:eyes,alpha:1,duration:240,delay:400,ease:'Sine.out'});
    scene.tweens.add({targets:eyes,alpha:0,duration:240,delay:950});
    scene.tweens.add({targets:hero,alpha:1,y:cy+15,duration:550,delay:1000,ease:'Cubic.out'});
    if(weapon)scene.tweens.add({targets:weapon,alpha:1,y:cy-18,angle:-45,duration:650,delay:1050,ease:'Cubic.out'});
    scene.tweens.add({targets:halo,alpha:.9,duration:450,delay:1200,ease:'Sine.out'});
    scene.tweens.add({targets:label,alpha:1,duration:350,delay:1450});
    scene.tweens.add({targets:root,alpha:0,duration:500,delay:2200,ease:'Sine.inOut',onComplete:()=>{root.destroy(true);resolve();}});
    root.once('destroy',resolve);
  });
}
