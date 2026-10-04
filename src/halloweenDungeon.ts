import { addDiamondTreasury } from './dungeon';
import type { DungeonData, Room } from './dungeon';
import type { TileType, Vec2 } from './types';

export interface HalloweenDecoration extends Vec2 { key: string; size: number }
export function halloweenDecorations(d: DungeonData, floor: number): HalloweenDecoration[] {
  const motifs = [['pumpkins', 'tree'], ['grave', 'lantern'], ['books', 'cauldron'], ['armor', 'coffin'], ['throne', 'lantern']][floor - 1];
  return d.rooms.filter(r => !d.optionalRooms.some(o=>o.room===r)).flatMap((r, i) => [
    { x: r.x + 1, y: r.y + 1, key: `hw_${motifs[i % 2]}`, size: 1.55 },
    { x: r.x + r.w - 2, y: r.y + 1, key: `hw_${motifs[(i + 1) % 2]}`, size: 1.55 },
    { x: r.x + 1, y: r.y + r.h - 2, key: 'hw_pumpkins', size: 1.25 },
    { x: r.x + r.w - 2, y: r.y + r.h - 2, key: 'hw_lantern', size: 1.2 }
  ]);
}

export const HALLOWEEN_LAYOUTS = [
  '蔓絡みの迷路', '双環の庭', '折れ曲がる墓道', '長廊下の書庫', '枝分かれの回廊',
  '裏道の収穫城', '深い袋小路', '蜘蛛の巣小路', '渡り廊下の庭', '迷宮の王路'
] as const;

/** Ten route styles, independently randomized mazes and five rooms including a large arena. */
export function generateHalloweenDungeon(floor: number, pattern?: number, random = Math.random): DungeonData {
  if (!Number.isInteger(floor) || floor < 1 || floor > 5) throw new Error('Invalid Halloween floor');
  const variant = pattern ?? Math.floor(random() * HALLOWEEN_LAYOUTS.length);
  if (!Number.isInteger(variant) || variant < 0 || variant >= 10) throw new Error('Invalid Halloween layout');
  const w = 49, h = 39;
  const tiles: TileType[][] = Array.from({length:h}, () => Array<TileType>(w).fill('wall'));
  const carve = (x:number,y:number) => {if(x>0&&y>0&&x<w-1&&y<h-1)tiles[y][x]='floor';};
  const room = (cx:number,cy:number,rw:number,rh:number):Room => ({x:cx-Math.floor(rw/2),y:cy-Math.floor(rh/2),w:rw,h:rh,cx,cy});
  const jitter = () => Math.floor(random()*3)-1;
  const layouts = [
    [[8,29],[8,9],[24,9],[24,29]], [[8,29],[8,10],[25,9],[24,28]],
    [[7,28],[8,8],[24,11],[24,29]], [[8,30],[9,10],[24,8],[24,27]],
    [[8,28],[7,9],[25,10],[24,29]], [[9,29],[8,8],[24,9],[25,28]],
    [[7,30],[9,10],[25,9],[24,28]], [[8,29],[8,9],[24,10],[24,30]],
    [[9,28],[7,8],[24,9],[25,29]], [[8,30],[9,9],[25,10],[24,28]]
  ];
  const rooms = layouts[variant].map(([cx,cy],i) => room(cx+jitter(),cy+jitter(),i===3?9:7,7));
  const boss = room(41,10+(variant%3),11,15);
  // A spanning-tree maze guarantees every passage is reachable before adding loops and rooms.
  const columns=17, rows=19, visited=new Set<string>(['0,0']);
  const stack: (Vec2 & {dx:number;dy:number})[]=[{x:0,y:0,dx:0,dy:0}];carve(1,1);
  const directions=[[1,0],[-1,0],[0,1],[0,-1]];
  while(stack.length){
    const current=stack[stack.length-1];
    const candidates=directions.map(([dx,dy])=>({x:current.x+dx,y:current.y+dy,dx,dy})).filter(n=>n.x>=0&&n.y>=0&&n.x<columns&&n.y<rows&&!visited.has(`${n.x},${n.y}`));
    if(!candidates.length){stack.pop();continue;}
    const straight=candidates.find(n=>n.dx===current.dx&&n.dy===current.dy);
    const next=straight&&random()<(variant===3||variant===8?.8:.25)?straight:candidates[Math.floor(random()*candidates.length)];
    carve(1+current.x*2+next.dx,1+current.y*2+next.dy);carve(1+next.x*2,1+next.y*2);
    visited.add(`${next.x},${next.y}`);stack.push(next);
  }
  const loopRate=[.04,.22,.06,.12,.09,.18,0,.25,.14,.07][variant];
  for(let y=2;y<h-2;y++)for(let x=2;x<34;x++){
    if(tiles[y][x]!=='wall'||random()>=loopRate)continue;
    if(x%2===0&&y%2===1&&tiles[y][x-1]==='floor'&&tiles[y][x+1]==='floor'||x%2===1&&y%2===0&&tiles[y-1][x]==='floor'&&tiles[y+1][x]==='floor')carve(x,y);
  }
  for(const r of rooms){
    // Clear a perimeter so corner furnishings never sever maze branches.
    for(let y=r.y-1;y<=r.y+r.h;y++)for(let x=r.x-1;x<=r.x+r.w;x++)carve(x,y);
  }
  for(let y=boss.y;y<boss.y+boss.h;y++)for(let x=boss.x;x<boss.x+boss.w;x++)carve(x,y);
  // One winding approach to the arena, separate from the maze's other branches.
  const approachY=25+variant%5;
  for(let x=33;x<=boss.cx;x++)carve(x,approachY);
  for(let y=boss.y+boss.h;y<=approachY;y++)carve(boss.cx,y);
  const start={x:rooms[0].cx,y:rooms[0].cy},stairs={x:boss.cx,y:boss.y+boss.h-2};
  const flipX=variant%2===1,flipY=variant>=5;
  const transform=(p:Vec2):Vec2=>({x:flipX?w-1-p.x:p.x,y:flipY?h-1-p.y:p.y});
  const transformRoom=(r:Room):Room=>({...r,x:flipX?w-r.x-r.w:r.x,y:flipY?h-r.y-r.h:r.y,...{cx:transform({x:r.cx,y:r.cy}).x,cy:transform({x:r.cx,y:r.cy}).y}});
  const mapped=tiles.map((row,y)=>row.map((_,x)=>tiles[flipY?h-1-y:y][flipX?w-1-x:x]));
  const finalBoss=transformRoom(boss),exit=transform(stairs);
  mapped[exit.y][exit.x]='door';
  return addDiamondTreasury({w,h,tiles:mapped,rooms:[...rooms.map(transformRoom),finalBoss],start:transform(start),stairs:exit,bossRoom:finalBoss,bossRoomZone:flipX?'west':'east',exitRoom:finalBoss,hazards:[],teleportPads:[],biome:'ruins',optionalRooms:[]}, random);
}
