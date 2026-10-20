import {advance, change, snapshot} from './core.js';
const MATCH = ['https://www.doubao.com/chat/*','https://doubao.com/chat/*'];
let queue = Promise.resolve();
function serial(fn) { const result = queue.then(fn); queue = result.catch(()=>{}); return result; }
async function ensureAlarm() { if (!await chrome.alarms.get('qq-level-clock')) await chrome.alarms.create('qq-level-clock', {periodInMinutes:0.5}); }
async function tick(command='SNAPSHOT', value) {
  const [saved, session, tabs, idle] = await Promise.all([
    chrome.storage.local.get('progress'), chrome.storage.session.get('clock'),
    chrome.tabs.query({url:MATCH}), chrome.idle.queryState(60)
  ]);
  const eligible = tabs.length>0 && idle !== 'locked';
  const updated = advance(saved.progress, session.clock, Date.now(), eligible);
  const state = change(updated.state, command, value);
  await chrome.storage.local.set({progress:state});
  await chrome.storage.session.set({clock:updated.clock});
  const reason = !tabs.length ? '打开 豆包 后开始累计' : idle==='locked' ? '锁屏暂停' : '正在累计 · 后台也算';
  const view = snapshot(state, eligible, reason);
  await Promise.allSettled(tabs.map(tab=>chrome.tabs.sendMessage(tab.id, {type:'QQ_LEVEL_STATE', state:view})));
  await chrome.action.setBadgeText({text:String(view.rank.level)});
  await chrome.action.setBadgeBackgroundColor({color:state.demo ? '#b45309' : '#2478c8'});
  return view;
}
chrome.runtime.onMessage.addListener((message, sender, reply)=>{
  if (sender.id !== chrome.runtime.id || message?.type !== 'QQ_LEVEL_COMMAND') return;
  if (sender.tab && !/^https:\/\/(www\.)?doubao\.com\/chat(?:\/|\?|$)/.test(sender.tab.url||'')) return;
  serial(()=>tick(message.command, message.value)).then(state=>reply({ok:true,state}), error=>reply({ok:false,error:error.message}));
  return true;
});
chrome.alarms.onAlarm.addListener(a=>{if(a.name==='qq-level-clock') serial(()=>tick()).catch(console.error);});
chrome.tabs.onRemoved.addListener(()=>serial(()=>tick()).catch(console.error));
chrome.tabs.onUpdated.addListener((_id, info)=>{if(info.url || info.status==='complete') serial(()=>tick()).catch(console.error);});
chrome.idle.onStateChanged.addListener(()=>serial(()=>tick()).catch(console.error));
chrome.runtime.onStartup.addListener(()=>serial(async()=>{await chrome.storage.session.remove('clock');await ensureAlarm();await tick();}).catch(console.error));
chrome.runtime.onInstalled.addListener(()=>serial(async()=>{await chrome.storage.session.remove('clock');await ensureAlarm();await tick();}).catch(console.error));
ensureAlarm().catch(console.error);
