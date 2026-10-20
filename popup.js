if(!globalThis.chrome?.runtime?.id){
 document.getElementById('panel').innerHTML='<div style="padding:24px 12px"><h2>皮肤已装在浏览器里</h2><p>请打开下面的 豆包 网页查看效果。这个文件只是扩展设置面板，不能单独运行。</p></div>';
}else{
 const panel=new window.QQLevelPanel(document.getElementById('panel'),send);
 async function send(command='SNAPSHOT',value){const r=await chrome.runtime.sendMessage({type:'QQ_LEVEL_COMMAND',command,value});if(!r?.ok)throw Error(r?.error||'连接失败');panel.render(r.state);}
 send().catch(e=>panel.error(e.message));setInterval(()=>send().catch(e=>panel.error(e.message)),1000);
}
