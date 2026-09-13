import type { MonsterDef } from './types';

// Base stats use the existing midboss scaling; the 25F milestone keeps its own stats.
export const THUNDER_BOSSES: Readonly<Record<number, MonsterDef>> = {
  21: {
    key: 'm_voltyrex', name: '雷竜ヴォルティレックス',
    description: '濃紺の鱗に金色の雷紋を持つティラノサウルス。巨大な顎と短い前脚、太い尾が特徴。前方の予告マスへ帯電した顎を叩き込む。',
    hp: 58, atkMin: 11, atkMax: 19, def: 13, exp: 17, gold: 20, score: 105,
    minFloor: 21, maxFloor: 21, behavior: 'chase', element: 'thunder', color: 0xe9c65d, isDragonType: false
  },
  22: {
    key: 'm_spark_beetle', name: '電甲蟲スパルク',
    description: '黒い鉄鉱石のような甲殻と大きな顎を持つ雷の甲虫。硬い殻に電気を蓄え、前方へ扇形の放電を行う。',
    hp: 60, atkMin: 14, atkMax: 23, def: 15, exp: 20, gold: 24, score: 130,
    minFloor: 22, maxFloor: 22, behavior: 'chase', element: 'thunder', color: 0x8acaff, isDragonType: false
  },
  23: {
    key: 'm_galvan', name: '雷機兵ガルヴァン',
    description: '青灰色の石と銅で造られた古代の機械兵。胸の雷核を光らせ、隙間を残した2本の帯状雷撃を地面に走らせる。',
    hp: 74, atkMin: 16, atkMax: 26, def: 12, exp: 25, gold: 28, score: 155,
    minFloor: 23, maxFloor: 23, behavior: 'chase', element: 'thunder', color: 0x8cdcff, isDragonType: false
  },
  24: {
    key: 'm_amatsuchi', name: '嵐蛇アマツチ',
    description: '金色の雷紋を持つ濃紺の大蛇。鎌首をもたげ、外側から内側へ時間差で落雷を呼ぶ。数字の予告を見て安全な場所へ動こう。',
    hp: 76, atkMin: 15, atkMax: 26, def: 13, exp: 25, gold: 28, score: 158,
    minFloor: 24, maxFloor: 24, behavior: 'chase', element: 'thunder', color: 0xdbd780, isDragonType: false
  },
  25: {
    key: 'm_raiga', name: '轟雷王ライガ',
    description: '白銀のたてがみと濃紺の体、金色の牙を持つ雷獣の王。予告した直線へ突進し、雷鳴の咆哮で十字に落雷を起こす。突進を避ければ反撃の隙が生まれる。',
    hp: 86, atkMin: 15, atkMax: 25, def: 17, exp: 27, gold: 30, score: 170,
    minFloor: 25, maxFloor: 25, behavior: 'chase', element: 'thunder', color: 0xa7d7ff, isDragonType: false
  }
};
