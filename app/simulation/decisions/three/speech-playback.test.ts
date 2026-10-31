import assert from 'node:assert/strict';
import { test } from 'node:test';
import { unlockAudio } from '../stage-sound';
import { voicesEnabled } from '../stage-voice';
import { say, speechBus } from './speech';
let gesture = false;
const contexts: FakeAudio[] = [];
class FakeAudio {
  state = 'suspended'; currentTime=0; destination={};
  constructor(){contexts.push(this); if(gesture)this.state='running';}
  resume(){if(gesture)this.state='running';return Promise.resolve();}
  decodeAudioData(){return Promise.resolve({duration:.01,length:240,sampleRate:24000,getChannelData:()=>new Float32Array(240).fill(.2)});}
  createGain(){return {gain:{value:1},connect(){},disconnect(){}};}
  createBufferSource(){const isRunning=()=>this.state==='running';return {buffer:null,connect(){},disconnect(){},onended:null as null|(()=>void),start(){if(isRunning())setTimeout(()=>this.onended?.(),15);},stop(){this.onended?.();}};}
}
const storage = new Map();
Object.assign(globalThis,{AudioContext:FakeAudio,window:{localStorage:{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v)},setTimeout,clearTimeout}});
test('cloud voices remain enabled on browsers without speechSynthesis',()=>assert.equal(voicesEnabled(),true));
test('dialogue uses the context unlocked by the entry click',async()=>{
  Object.assign(window,{speechSynthesis:{getVoices:()=>[],cancel(){},speak(){}},AudioContext:FakeAudio});
  Object.assign(globalThis,{fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(44)})});
  gesture=true; unlockAudio(); gesture=false;
  const result=await Promise.race([say('priya','Before we approve this payment.').then(()=>true),new Promise(r=>setTimeout(()=>r(false),350))]);
  assert.equal(result,true,`Speech never finished; contexts: ${contexts.map(c=>c.state).join(',')}`);
  assert.equal(speechBus.current,null);
});

test('expired access is visible and never treated as a finished spoken line', async()=>{
  const {stopSpeech}=await import('./speech');
  Object.assign(globalThis,{fetch:async()=>({ok:false,status:401})});
  const pending=say('david','A different line after session expiry.');
  await new Promise(r=>setTimeout(r,10));
  assert.equal(speechBus.playback,'error');
  assert.equal(speechBus.issue,'session');
  stopSpeech();
  assert.equal(await pending,false);
});
