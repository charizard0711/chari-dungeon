import Phaser from 'phaser';
import { finishLoading, showLoading, updateLoading } from './loadingScreen';

const TITLE_VIDEO_URL = 'assets/video/title-lake-wing-loop.mp4';
let titleVideoSource = TITLE_VIDEO_URL;

/** Fetch once and report the actual downloaded bytes before starting the title. */
export async function prepareTitleVideo(): Promise<void> {
  updateLoading(.75, 'オープニング動画を読み込み中…');
  try {
    const response = await fetch(TITLE_VIDEO_URL);
    if (!response.ok) throw new Error(`Video HTTP ${response.status}`);
    const total = Number(response.headers.get('content-length'));
    if (!response.body) throw new Error('Video response has no body');
    const reader = response.body.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(new Uint8Array(value));
      received += value.byteLength;
      if (total > 0) updateLoading(.75 + .23 * Math.min(1, received / total), 'オープニング動画を読み込み中…');
      else updateLoading(.75, `オープニング動画を読み込み中（${(received / 1048576).toFixed(1)} MB取得済み）…`);
    }
    titleVideoSource = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
    updateLoading(.98, '動画の再生を準備中…');
  } catch (error) {
    console.error('動画の先読みを再試行します', error);
  }
}

let played = false;

/** 起動ごとに一度だけ、タイトルの上で短いOPを再生する。 */
export function playTitleOpening(scene: Phaser.Scene): void {
  const params = new URLSearchParams(location.search);
  if (played || (location.hostname === 'localhost' && (params.has('qa-silent') || params.has('qa-game')))) return;
  played = true;
  const parent = document.getElementById('game-container');
  if (!parent) return;
  const overlay = document.createElement('div');
  overlay.id = 'title-opening';
  const video = document.createElement('video');
  video.src = 'assets/video/title-opening-cropped.mp4';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  const logo = document.createElement('img');
  logo.src = 'assets/ui/brand-v1/golden-crossed-swords.png';
  logo.alt = 'ちゃりだんじょん';
  const skip = document.createElement('button');
  skip.textContent = 'クリック / Enter でスキップ';
  overlay.append(video, logo, skip);
  parent.append(overlay);
  scene.input.enabled = false;
  let closing = false;
  let removed = false;
  let fadeTimer: ReturnType<typeof setTimeout> | undefined;
  const safetyTimer = setTimeout(() => finish(), 12000);
  const cleanup = () => {
    if (removed) return;
    removed = true;
    clearTimeout(safetyTimer);
    clearTimeout(fadeTimer);
    window.removeEventListener('keydown', key, true);
    video.pause();
    video.removeAttribute('src');
    video.load();
    overlay.remove();
    scene.input.enabled = true;
  };
  const finish = () => {
    if (closing) return;
    closing = true;
    overlay.classList.add('is-closing');
    fadeTimer = setTimeout(cleanup, 850);
  };
  const key = (event: KeyboardEvent) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (['Enter', ' ', 'Escape'].includes(event.key)) finish();
  };
  window.addEventListener('keydown', key, true);
  overlay.addEventListener('click', finish);
  video.addEventListener('ended', finish);
  video.addEventListener('error', finish);
  video.addEventListener('playing', () => overlay.classList.add('is-playing'), { once: true });
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  void video.play().catch(finish);
}


/** メニュー選択中も湖の動画を繰り返し再生する。 */
export function addTitleLoop(scene: Phaser.Scene): void {
  showLoading(.98);
  const fallback = scene.add.image(0, 0, 'title_citadel_v1').setDepth(-3);
  const inputEnabled = scene.input.enabled;
  scene.input.enabled = false;
  const videos = [0, 1].map(index => scene.add.video(0, 0).setName(`title-lake-video-${index}`).setDepth(-2).setAlpha(0));
  const fit = () => {
    const camera = scene.cameras.main;
    fallback.setPosition(camera.midPoint.x, camera.midPoint.y);
    fallback.setScale(Math.max(scene.scale.width / camera.zoom / fallback.width, scene.scale.height / camera.zoom / fallback.height));
    for (const video of videos) {
      video.setPosition(camera.midPoint.x, camera.midPoint.y);
      if (video.width && video.height) video.setScale(Math.max(scene.scale.width / camera.zoom / video.width, scene.scale.height / camera.zoom / video.height));
    }
  };
  let active = 0;
  let transitioning = false;
  let ready = false;
  const reveal = () => {
    if (ready) return;
    ready = true;
    clearTimeout(safetyTimer);
    updateLoading(1, '準備ができました');
    scene.game.events.once(Phaser.Core.Events.POST_RENDER, finishLoading);
    scene.input.enabled = inputEnabled;
  };
  const safetyTimer = setTimeout(reveal, 15000);
  for (const video of videos) {
    video.loadURL(titleVideoSource, true);
    video.on('playing', fit);
  }
  // `created` fires after Phaser has received and sized the first decoded frame.
  videos[0].once('created', () => {
    fit();
    videos[0].setAlpha(1);
    reveal();
  });
  videos[0].once('error', () => {
    console.error('オープニング動画を読み込めませんでした');
    reveal();
  });
  videos[0].play(true);
  fit();
  // Wing poses are matched by trimming; a short overlap softens the remaining seam.
  const update = () => {
    const current = videos[active];
    if (transitioning || !current.video || !Number.isFinite(current.video.duration)
      || current.video.duration - current.video.currentTime > .1 || current.video.currentTime < .1) return;
    transitioning = true;
    const next = videos[1 - active];
    next.setCurrentTime(0);
    next.setAlpha(0).setDepth(current.depth + 1);
    next.once('playing', () => {
      scene.tweens.add({ targets: next, alpha: 1, duration: 80, onComplete: () => {
        current.setAlpha(0).stop();
        current.setDepth(-2); next.setDepth(-2);
        active = 1 - active;
        transitioning = false;
      } });
    });
    next.play(true);
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, update);
  scene.scale.on('resize', fit);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    clearTimeout(safetyTimer);
    scene.game.events.off(Phaser.Core.Events.POST_RENDER, finishLoading);
    scene.scale.off('resize', fit);
    scene.events.off(Phaser.Scenes.Events.UPDATE, update);
    videos.forEach(video => video.stop());
  });
}

