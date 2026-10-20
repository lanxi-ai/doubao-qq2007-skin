(() => {
 const KEY='qqNudge',WAIT_MS=5*60*1000;
 const clean=v=>({enabled:v?.enabled!==false,sound:v?.sound!==false,shake:v?.shake!==false});
 window.QQNudge=function(root,feedback,isPopup){
  const css=document.createElement('style');css.textContent=`.nudge-settings{border-top:1px solid #6a9bc344;margin-top:14px;padding-top:10px}.nudge-settings strong{font-size:13px}.nudge-settings .check{margin:8px 0}.nudge-status{font-size:11px;color:#4e6e8a;margin:8px 0;line-height:1.6}.nudge-preview{border:1px solid #70a9d2;border-radius:7px;background:linear-gradient(#fff,#c1e1f8);padding:6px 10px;font:inherit;color:inherit}.nudge-hint{font-size:11px;color:#4e6e8a;line-height:1.6;margin-top:8px}.nudge-toast{position:fixed;inset:85px 22px auto auto;margin:0;max-width:calc(100vw - 32px);width:255px;padding:15px 18px;border:1px solid #76b0d5;border-radius:13px;background:linear-gradient(#f8fcff,#d8edff);color:#23577e;box-shadow:0 8px 25px #24578133;font:14px/1.5 system-ui;pointer-events:none}.nudge-toast::backdrop{display:none}.nudge-toast strong{display:block;margin-bottom:4px}.nudge-toast span{font-size:12px}`;root.append(css);
  const controls=document.createElement('div');controls.className='nudge-settings';controls.innerHTML=`<strong>五分钟未回复提醒</strong><label class="check"><input class="nudge-enabled" type="checkbox">开启未回复提醒</label><label class="check"><input class="nudge-shake" type="checkbox">提醒时窗口抖一下</label><label class="check"><input class="nudge-sound" type="checkbox">提醒时响“咳咳”提示音</label><div class="nudge-status" aria-live="off">等待本页新的 豆包回复</div><button class="nudge-preview" type="button">试听并预览提醒</button><div class="nudge-hint">回复结束后等 5 分钟，每轮提醒一次。发送下一条消息或离开对话后取消；正在打字时稍后提醒。音量沿用上方设置。</div>`;
  root.querySelector('.settings .test').before(controls);
  const toast=document.createElement('div');toast.className='nudge-toast';toast.popover='manual';toast.setAttribute('role','status');toast.innerHTML='<strong></strong><span></span>';root.append(toast);
  const $=s=>controls.querySelector(s);let prefs=clean(),loaded=false,skinEnabled=true,saving=false,waiting=null,lastInput=-Infinity,lastTick=Date.now(),motion=null,toastTimer=null,disposed=false;
  function text(t){if($('.nudge-status').textContent!==t)$('.nudge-status').textContent=t;}
  function hide(){clearTimeout(toastTimer);if(toast.matches(':popover-open'))toast.hidePopover();}
  function cancel(){waiting=null;motion?.cancel();hide();updateStatus();}
  function updateStatus(){
   if(!loaded){text('正在读取提醒设置…');return;}if(!skinEnabled){text('怀旧界面已关闭，提醒暂停');return;}if(!prefs.enabled){text('未回复提醒已关闭');return;}if(!waiting){text(isPopup?'在 豆包 页面接收回复后开始计时':'等待本页新的 豆包回复');return;}if(waiting.fired){return;}
   const ms=Math.max(0,waiting.due-Date.now());if(!ms&&Date.now()-lastInput<30000){text('你正在输入，稍后再提醒');return;}
   const s=Math.ceil(ms/1000);text(`距未回复提醒 ${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`);
  }
  function show(preview){if(document.hidden||root.querySelector('dialog[open]'))return;toast.querySelector('strong').textContent=preview?'抖一抖 · 效果预览':'还在吗？';toast.querySelector('span').textContent=preview?'仅预览，不改变五分钟计时':'回复已经准备好了，等你接着聊。';toast.showPopover();clearTimeout(toastTimer);toastTimer=setTimeout(hide,3500);}
  function shake(){if(!prefs.shake||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches||root.querySelector('dialog[open]'))return false;const el=isPopup?root.querySelector('.profile'):document.querySelector('#chat-route-layout');if(!el)return false;motion?.cancel();motion=el.animate([{transform:'translateX(0)'},{transform:'translateX(-7px)'},{transform:'translateX(7px)'},{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(-2px)'},{transform:'translateX(0)'}],{duration:520,easing:'ease-in-out'});return true;}
  function tick(){
   if(disposed)return;const now=Date.now(),gap=now-lastTick;lastTick=now;
   if(waiting&&[...document.querySelectorAll('[data-message-id]:not(.justify-end) [data-streaming="true"]')].some(el=>el.getClientRects().length)){cancel();return;}
   if(waiting&&waiting.route!==location.pathname){cancel();}
   // Browser suspension, sleep and clock reversal never produce an unexpected catch-up alert.
   if(waiting&&(gap>90000||gap<0)){cancel();text('长时间暂停后已取消本轮提醒');return;}
   if(!loaded||!skinEnabled||!prefs.enabled||!waiting||waiting.fired){updateStatus();return;}
   if(now<waiting.due||now-lastInput<30000){updateStatus();return;}
   waiting.fired=true;const played=prefs.sound&&feedback.nudgeSound();shake();show(false);
   text(prefs.sound&&!played?'本轮已提醒；声音未播放，可点试听启用':'本轮已提醒，等下一次回复再计时');
  }
  function renderPrefs(){for(const key of ['enabled','sound','shake']){$('.nudge-'+key).checked=prefs[key];$('.nudge-'+key).disabled=!loaded||saving;}$('.nudge-preview').disabled=!loaded||saving;}
  async function save(patch){if(!loaded||saving)return;const before=prefs;let failed=false;saving=true;renderPrefs();try{const next=clean({...prefs,...patch});await chrome.storage.local.set({[KEY]:next});prefs=next;if(!prefs.enabled)cancel();if(!prefs.shake)motion?.cancel();}catch{prefs=before;failed=true;}finally{saving=false;renderPrefs();updateStatus();if(failed)text('设置保存失败，请重试');}}
  chrome.storage.local.get(KEY).then(data=>{prefs=clean(data[KEY]);loaded=true;renderPrefs();updateStatus();}).catch(()=>{text('提醒设置读取失败，请刷新重试');});
  const storageChanged=(changes,area)=>{if(area==='local'&&changes[KEY]){prefs=clean(changes[KEY].newValue);if(!prefs.enabled)cancel();if(!prefs.shake)motion?.cancel();renderPrefs();updateStatus();}};chrome.storage.onChanged.addListener(storageChanged);
  for(const key of ['enabled','sound','shake'])$('.nudge-'+key).onchange=e=>{if(e.target.checked&&key!=='shake')feedback.prepareNudgeSound();save({[key]:e.target.checked});};
  $('.nudge-preview').onclick=async()=>{if(!skinEnabled){text('请先开启怀旧界面');return;}shake();show(true);const played=prefs.sound&&await feedback.previewNudgeSound();text(prefs.sound&&!played?'声音未播放，请检查音量或再次试听':'提醒效果已预览，计时未改变');};
  const unlock=e=>{if(e.isTrusted&&loaded&&prefs.enabled&&prefs.sound&&skinEnabled)feedback.prepareNudgeSound();};
  const input=e=>{if(e.isTrusted&&e.target instanceof Element&&e.target.matches(window.QQSite.editor))lastInput=Date.now();};
  const visibility=()=>{if(document.hidden){hide();motion?.cancel();}tick();};
  if(!isPopup){document.addEventListener('click',unlock,true);document.addEventListener('keydown',unlock,true);document.addEventListener('input',input,true);document.addEventListener('visibilitychange',visibility);}
  const dialogObserver=new MutationObserver(()=>{if(root.querySelector('dialog[open]')){hide();motion?.cancel();}});dialogObserver.observe(root,{subtree:true,attributes:true,attributeFilter:['open']});
  const interval=isPopup?null:setInterval(tick,1000);renderPrefs();
  return {
   replyComplete(){if(disposed||isPopup||!loaded||!skinEnabled||!prefs.enabled)return;waiting={route:location.pathname,due:Date.now()+WAIT_MS,fired:false};lastTick=Date.now();updateStatus();},
   cancel,
   render(state){skinEnabled=state.enabled;if(!skinEnabled)cancel();else tick();},
   destroy(){disposed=true;cancel();clearInterval(interval);dialogObserver.disconnect();chrome.storage.onChanged.removeListener?.(storageChanged);document.removeEventListener('click',unlock,true);document.removeEventListener('keydown',unlock,true);document.removeEventListener('input',input,true);document.removeEventListener('visibilitychange',visibility);}
  };
 };
})();
