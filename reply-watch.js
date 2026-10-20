(() => {
 const EDITOR=window.QQSite.editor;
 const ASSISTANT='[data-message-role="assistant"] [data-message-id],[data-message-id]:not(.justify-end):has([data-streaming])';
 const HOME=p=>/^\/chat\/?$/.test(p);
 const shown=n=>!!n&&n.getClientRects().length>0;
 window.QQReplyWatch=function(onComplete,hooks={}){
  let run=null,timer=null;
  function reset(){run=null;clearTimeout(timer);hooks.onCancel?.();}
  function arm(){if(run&&Date.now()-run.at<1000)return;reset();hooks.onSend?.();run={at:Date.now(),route:location.pathname,startedOnHome:HOME(location.pathname),ids:new Set([...document.querySelectorAll(ASSISTANT)].map(n=>n.dataset.messageId)),sawBusy:false,quietAt:0};}
  function scan(){
   if(!run)return;
   if(location.pathname!==run.route){if(run.startedOnHome&&/^\/chat\/[^/]+$/.test(location.pathname))run.route=location.pathname;else{reset();return;}}
   if(Date.now()-run.at>30*60*1000||!run.sawBusy&&Date.now()-run.at>120000){reset();return;}
   const fresh=[...document.querySelectorAll(ASSISTANT)].filter(n=>!run.ids.has(n.dataset.messageId)&&shown(n));
   if(fresh.some(n=>n.querySelector('[data-streaming="true"]'))){run.sawBusy=true;run.quietAt=0;return;}
   if(!fresh.length)return;
   // Wait for the native read-aloud action, not just a temporary pause in streamed text.
   const complete=fresh.every(n=>n.querySelector('[data-streaming="false"]')&&(n.closest('[data-message-role="assistant"]')||n.closest('[data-target-id="message-box-target-id"]'))?.querySelector('button[aria-label="朗读"],[data-testid="audio_play_button"]'));
   // Very short replies may finish between observer callbacks. A fresh native
   // assistant message plus its completion controls is also sufficient.
   if(!complete){run.quietAt=0;return;}
   if(!run.quietAt)run.quietAt=Date.now();
   if(Date.now()-run.quietAt<1000){clearTimeout(timer);timer=setTimeout(scan,1050);return;}
   reset();onComplete();
  }
  function click(e){if(!e.isTrusted||!(e.target instanceof Element))return;const t=e.target;
   const link=t.closest('a[href]');if(link&&new URL(link.href,location.href).pathname!==location.pathname){reset();return;}
   if(t.closest('[data-qq-new-chat]')){reset();return;}
   if(t.closest('[data-testid="chat_input_stop_button"],button[aria-label="停止回答"],button[aria-label="停止生成"]')){reset();return;}
   if(t.closest('[data-testid="chat_input_send_button"]'))arm();
  }
  function key(e){if(e.isTrusted&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&e.target instanceof Element&&e.target.matches(EDITOR))arm();}
  const observer=new MutationObserver(records=>{
   if(run)for(const r of records){if(r.type==='attributes'&&r.attributeName==='data-streaming'&&r.oldValue==='true')run.sawBusy=true;for(const n of r.addedNodes)if(n instanceof Element&&(n.matches('[data-streaming="true"]')||n.querySelector('[data-streaming="true"]')))run.sawBusy=true;}
   scan();
  });
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeOldValue:true,attributeFilter:['data-streaming','aria-label']});
  document.addEventListener('click',click,true);document.addEventListener('keydown',key,true);window.addEventListener('popstate',reset);const interval=setInterval(scan,500);
  return {destroy(){reset();observer.disconnect();clearInterval(interval);document.removeEventListener('click',click,true);document.removeEventListener('keydown',key,true);window.removeEventListener('popstate',reset);}};
 };
})();
