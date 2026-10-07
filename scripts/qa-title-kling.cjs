const assert=require('node:assert/strict'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{const p=await b.newPage({viewport:{width:1280,height:900}});await p.goto('http://localhost:5176/assets/video/title-lake-kling-loop-v2.mp4');
const result=await p.evaluate(async()=>{
 const video=document.querySelector('video');video.muted=true;video.pause();if(video.readyState<2)await new Promise(resolve=>video.addEventListener('loadeddata',resolve,{once:true}));
 const c=document.createElement('canvas');c.width=160;c.height=90;const ctx=c.getContext('2d');
 async function sample(time){video.currentTime=time;await new Promise(resolve=>video.addEventListener('seeked',resolve,{once:true}));ctx.drawImage(video,0,0,160,90);return [...ctx.getImageData(0,0,160,90).data];}
 const head=await sample(.001),tail=await sample(video.duration-1/24-.001);let error=0;for(let i=0;i<head.length;i++)if(i%4!==3)error+=Math.abs(head[i]-tail[i]);error/=160*90*3;
 video.currentTime=0;video.loop=true;await video.play();return {duration:video.duration,width:video.videoWidth,height:video.videoHeight,seamMeanError:error};
});assert.equal(result.width,1600);assert.equal(result.height,900);assert.ok(result.duration>=4.45&&result.duration<=4.6);assert.ok(result.seamMeanError<8,'visible loop seam');await p.screenshot({path:'outputs/title-kling-preview.png'});console.log(result);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
