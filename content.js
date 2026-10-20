(() => {
 if(window.__qqLevelMounted)return;window.__qqLevelMounted=true;
 const html=document.documentElement,host=document.createElement('div'),frame=document.createElement('div');
 host.id='qq-level-panel';host.dataset.adapterVersion='2026-10-12.2';frame.id='qq-retro-chrome';
 frame.innerHTML='<div class="qq-titlebar"><div class="qq-brand"><span>豆包</span></div><div class="qq-window-tools"><button class="qq-emojis" aria-label="打开表情面板">☺</button><button class="qq-decor" aria-label="打开装扮中心">✦</button><button class="qq-paint" aria-label="打开换肤设置">⚙</button><button class="qq-exit" aria-label="恢复原版界面">×</button></div></div>';
 const assets=document.createElement('style');assets.textContent=`html{--qq-wallpaper:url("${chrome.runtime.getURL('assets/sky.png')}")}`;
 let stopped=false,pending=false,active=true;
 async function send(command,value){const r=await chrome.runtime.sendMessage({type:'QQ_LEVEL_COMMAND',command,value});if(!r?.ok)throw Error(r?.error||'连接失败');render(r.state);}
 const panel=window.QQLevelPanel(host,send),watch=window.QQReplyWatch(()=>panel.replyComplete(),{onSend:panel.cancelReplyWait,onCancel:panel.cancelReplyWait});
 frame.querySelector('.qq-decor').onclick=panel.openDecor;frame.querySelector('.qq-emojis').onclick=panel.openEmojis;frame.querySelector('.qq-paint').onclick=panel.openSettings;frame.querySelector('.qq-exit').onclick=()=>send('ENABLED',false);
 function render(state){active=state.enabled;panel.render(state);if(active)html.dataset.qqTheme=state.theme;else delete html.dataset.qqTheme;mount();}
 function mount(){
  const sidebar=document.querySelector(window.QQSite.sidebar);const box=sidebar?.getBoundingClientRect();const visible=innerWidth>760&&sidebar&&box.width>180&&box.right>180&&box.left<100;
  if(visible){if(host.parentElement!==sidebar)sidebar.prepend(host);host.dataset.placement='sidebar';}
  else{const bar=frame.querySelector('.qq-titlebar');if(host.parentElement!==bar)bar.querySelector('.qq-window-tools').before(host);host.dataset.placement='compact';}
  if(!assets.isConnected)document.head.append(assets);if(!frame.isConnected)document.body.append(frame);
  for(const el of sidebar?.querySelectorAll('button,[class~="group/sidebar_nav_item"]')||[]){
   if((el.getAttribute('aria-label')||el.textContent).trim().startsWith('新对话')&&!el.hasAttribute('data-qq-new-chat'))el.setAttribute('data-qq-new-chat','');
  }
 }
 async function heartbeat(){if(stopped||pending)return;pending=true;try{await send('SNAPSHOT');}catch{panel.error('扩展已更新，请刷新网页');if(!chrome.runtime?.id){stopped=true;watch.destroy();panel.destroy();delete html.dataset.qqTheme;}}finally{pending=false;}}
 chrome.runtime.onMessage.addListener(m=>{if(m.type==='QQ_LEVEL_STATE')render(m.state);});
 mount();heartbeat();setInterval(heartbeat,5000);
 let mountTimer;new MutationObserver(()=>{clearTimeout(mountTimer);mountTimer=setTimeout(mount,100);}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-presentation','aria-expanded']});
 window.addEventListener('resize',mount);document.addEventListener('visibilitychange',heartbeat);
})();
