import Phaser from 'phaser';
import type { WeaponType } from './types';

export function drawSkillGlyph(g: Phaser.GameObjects.Graphics, type: WeaponType, color: number, size: number) {
  const s = size / 20;
  const line = (x1: number, y1: number, x2: number, y2: number) => g.lineBetween(x1 * s, y1 * s, x2 * s, y2 * s);
  g.clear().lineStyle(2.5, color, .78);
  if (type === 'dual_sword' || type === 'twin_daggers') {
    line(-15, -17, 15, 14); line(15, -17, -15, 14);
    line(-15, 4, -5, 14); line(15, 4, 5, 14);
    line(-15, 14, -19, 18); line(15, 14, 19, 18);
  } else if (type === 'dagger') {
    line(-10, 14, 12, -16); line(12, -16, 8, 2); line(8, 2, -3, 7);
    line(-10, 4, 1, 13); line(-10, 14, -14, 19);
    g.lineStyle(1.5, color, .4); line(-15, -8, -21, 1); line(-11, -10, -16, -1);
  } else if (type === 'longsword') {
    g.beginPath().arc(-5 * s, -5 * s, 23 * s, -.9, 1.5).strokePath();
    g.beginPath().arc(-8 * s, -4 * s, 17 * s, -.7, 1.6).strokePath();
    line(-10, 15, 14, -13); line(-11, 6, -2, 14);
  } else if (type === 'lance') {
    line(-14, 16, 15, -16); line(15, -16, 4, -9); line(15, -16, 11, -4); line(4, -9, 11, -4);
    g.lineStyle(1.5, color, .45); line(-18, 6, -5, -8); line(-8, 18, 5, 4);
  } else if (type === 'bow') {
    g.beginPath().arc(-8 * s, 0, 18 * s, -1.25, 1.25).strokePath();
    line(-2, -17, -12, 0); line(-12, 0, -2, 17); line(-17, 0, 21, 0);
    line(21, 0, 13, -6); line(21, 0, 13, 6);
  } else if (type === 'handgun') {
    g.strokeRect(-16 * s, -9 * s, 25 * s, 9 * s);
    line(-13, 0, -16, 14); line(-16, 14, -6, 14); line(-6, 14, -2, 0);
    for (const y of [-8, -1, 6]) line(14, y, 22, y);
  } else {
    line(-7, 13, 9, -17); line(9, -17, 15, -3); line(15, -3, 0, 16);
    line(-12, 7, 4, 16); line(-7, 13, -12, 21);
    g.lineStyle(1.8, color, .5).beginPath().arc(0, 0, 23 * s, -1.6, 2.1).strokePath();
  }
}
