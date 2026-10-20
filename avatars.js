(() => {
  const KEY = 'qqAvatar';
  const fallback = { id: 'penguin', name: '默认企鹅', path: 'assets/penguin.png' };
  const catalog = [fallback, ...(window.QQAvatarCatalog || [])];
  const byId = new Map(catalog.map(item => [item.id, item]));
  function clean(value) {
    if (value?.id === 'custom' && typeof value.data === 'string' && value.data.length < 500000 && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value.data)) return { id: 'custom', data: value.data };
    return { id: byId.has(value?.id) ? value.id : fallback.id };
  }
  const src = value => value.id === 'custom' ? value.data : chrome.runtime.getURL(byId.get(value.id).path);
  const name = value => value.id === 'custom' ? '自定义头像' : byId.get(value.id).name;
  const css = `
    .avatar{display:block;padding:0;border:0;background:transparent;border-radius:18px;cursor:pointer}.avatar:hover{outline:2px solid #4dace7;outline-offset:3px}.avatar:focus-visible{outline:3px solid #1679bf;outline-offset:3px}.avatar img.custom-face{object-fit:contain;background:linear-gradient(#e7f8ff,#98d0f5);border:2px solid #fff;border-radius:16px;padding:7px;box-shadow:0 0 0 1px #71b4e8,0 3px 7px #23689444}
    .avatar-preview>div{min-width:0}.avatar-preview img{flex-shrink:0}@media(max-width:410px){.avatar-preview{flex-wrap:wrap}.avatar-body{padding:12px}.avatar-foot{padding:10px 12px}}
    .avatar-dialog{color:#23577e;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;position:fixed;inset:0;margin:auto;width:min(620px,calc(100vw - 24px));height:fit-content;max-height:calc(100dvh - 32px);padding:0;border:1px solid #62a7dc;border-radius:16px;background:linear-gradient(140deg,#f5fcff,#cce8fb);box-shadow:inset 0 0 0 1px white,0 20px 70px #153d6966;overflow:hidden}.avatar-dialog::backdrop{background:#143f664d;backdrop-filter:blur(3px)}.avatar-dialog .layout{display:flex;flex-direction:column;max-height:calc(100dvh - 36px)}.avatar-head{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #82b8de66}.avatar-head strong{font-size:17px}.avatar-body{overflow:auto;min-height:0;padding:18px;overscroll-behavior:contain}.avatar-preview{display:flex;align-items:center;gap:18px;margin-bottom:18px}.avatar-preview img{width:86px;height:86px;object-fit:contain;border-radius:12px;background:#e8f6ff;border:1px solid #85b9dd;padding:5px}.avatar-caption{font-size:12px;margin:5px 0;color:#54718b}.avatar-actions{display:flex;gap:8px;flex-wrap:wrap}.avatar-dialog button,.change-avatar{font:inherit;color:inherit;cursor:pointer;border:1px solid #72a9d0;border-radius:7px;background:linear-gradient(#fff,#c3e3f8);padding:6px 12px}.avatar-dialog button:focus-visible{outline:3px solid #258bd0;outline-offset:2px}.avatar-dialog button:disabled{opacity:.5;cursor:wait}.avatar-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(62px,1fr));gap:10px}.avatar-grid button{padding:5px;position:relative;min-height:68px}.avatar-grid img{display:block;width:100%;height:52px;object-fit:contain;image-rendering:auto}.avatar-grid button[aria-pressed=true]{outline:3px solid #258bd0;background:#a8dfff}.avatar-grid button[aria-pressed=true]::after{content:'✓';position:absolute;right:0;bottom:0;background:#258bd0;color:#fff;font-size:11px;padding:0 4px;border-radius:4px}.avatar-foot{display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid #82b8de66}.avatar-foot .avatar-save{background:linear-gradient(#6bc9ff,#1686d6);color:#fff;border-color:#187ac0}.avatar-error{color:#a13625;min-height:20px;margin:6px 0 0;font-size:12px}.avatar-grid-title{margin:0 0 10px;font-size:13px}.change-avatar{margin:4px 0 8px}.avatar-dialog[open]{display:block}
  `;
  window.QQAvatarPicker = function(root) {
    const style = document.createElement('style'); style.textContent = css; root.append(style);
    const currentImage = root.querySelector('.avatar img');
    const trigger = root.querySelector('.avatar');
    trigger.title = '更换头像'; trigger.setAttribute('aria-label', '更换头像');
    const settingsButton = document.createElement('button'); settingsButton.className = 'change-avatar'; settingsButton.textContent = '更换头像';
    root.querySelector('.settings .status').after(settingsButton);
    const dialog = document.createElement('dialog'); dialog.className = 'avatar-dialog'; dialog.setAttribute('aria-label', '更换头像');
    dialog.innerHTML = `<div class="layout"><div class="avatar-head"><strong>更换头像</strong><button class="avatar-close" aria-label="关闭头像选择">×</button></div><div class="avatar-body"><div class="avatar-preview"><img alt="头像预览"><div><strong class="avatar-name"></strong><p class="avatar-caption">选一个熟悉的老朋友</p><div class="avatar-actions"><button class="avatar-upload">上传图片</button><button class="avatar-default">默认企鹅</button></div><p class="avatar-caption">JPG / PNG / WebP · 最多 5 MB · 仅保存在本机</p><input class="avatar-file" type="file" accept="image/jpeg,image/png,image/webp" hidden></div></div><p class="avatar-grid-title"></p><div class="avatar-grid" aria-label="头像备选"></div><p class="avatar-error" role="status" aria-live="polite"></p></div><div class="avatar-foot"><button class="avatar-cancel">取消</button><button class="avatar-save">保存头像</button></div></div>`;
    root.append(dialog);
    const $ = selector => dialog.querySelector(selector);
    let current = { id: fallback.id }, draft = current, generation = 0, busy = false, saving = false;
    function renderCurrent() {
      currentImage.src = src(current); currentImage.alt = name(current);
      currentImage.classList.toggle('custom-face', current.id !== fallback.id);
      root.dispatchEvent(new CustomEvent('qq-avatar-changed'));
    }
    function preview() {
      $('.avatar-preview img').src = src(draft); $('.avatar-name').textContent = name(draft);
      for (const button of $('.avatar-grid').children) button.setAttribute('aria-pressed', String(button.dataset.id === draft.id));
    }
    function setBusy(value) { busy = value; $('.avatar-save').disabled = value; $('.avatar-upload').disabled = value; }
    function close() { if (saving) return; generation++; dialog.close(); setBusy(false); }
    function choose(value) { if (saving) return; generation++; draft = clean(value); $('.avatar-error').textContent = ''; setBusy(false); preview(); }
    function open() { if (dialog.open) return; draft = current; $('.avatar-error').textContent = ''; preview(); dialog.showModal(); }
    const ready = chrome.storage.local.get(KEY).then(data => { current = clean(data[KEY]); renderCurrent(); }).catch(() => { $('.avatar-error').textContent = '读取头像失败，请刷新网页重试。'; });
    trigger.onclick = settingsButton.onclick = async () => { await ready; open(); };
    $('.avatar-grid-title').textContent = catalog.length > 1 ? `经典头像 · ${catalog.length - 1} 张` : '经典头像正在整理，你也可以先上传自己的图片';
    for (const item of catalog) {
      const button = document.createElement('button'); button.dataset.id = item.id; button.title = item.name; button.setAttribute('aria-label', item.name);
      const img = document.createElement('img'); img.src = chrome.runtime.getURL(item.path); img.alt = ''; img.loading = 'lazy'; button.append(img);
      button.onclick = () => choose({ id: item.id }); $('.avatar-grid').append(button);
    }
    $('.avatar-default').onclick = () => choose({ id: fallback.id });
    $('.avatar-close').onclick = $('.avatar-cancel').onclick = close;
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    $('.avatar-upload').onclick = () => $('.avatar-file').click();
    $('.avatar-file').onchange = async event => {
      const file = event.target.files[0]; event.target.value = ''; if (!file) return;
      const token = ++generation; let bitmap;
      try {
        if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('请选择 JPG、PNG 或 WebP 图片。');
        if (file.size > 5 * 1024 * 1024) throw new Error('图片超过 5 MB，请换一张小一点的。');
        setBusy(true); $('.avatar-error').textContent = '正在读取图片…';
        bitmap = await createImageBitmap(file);
        if (bitmap.width * bitmap.height > 40000000) throw new Error('图片尺寸过大，请缩小后再试。');
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
        const context = canvas.getContext('2d'); const scale = Math.min(256 / bitmap.width, 256 / bitmap.height);
        const width = bitmap.width * scale, height = bitmap.height * scale;
        context.drawImage(bitmap, (256 - width) / 2, (256 - height) / 2, width, height);
        if (token !== generation || !dialog.open) return;
        draft = clean({ id: 'custom', data: canvas.toDataURL('image/png') }); $('.avatar-error').textContent = ''; preview();
      } catch (error) { if (token === generation) $('.avatar-error').textContent = error.message || '图片读取失败，请重新选择。'; }
      finally { bitmap?.close(); if (token === generation) setBusy(false); }
    };
    $('.avatar-save').onclick = async () => {
      if (busy || saving) return;
      const selected = clean(draft); saving = true; setBusy(true); $('.avatar-save').textContent = '保存中…';
      try { await chrome.storage.local.set({ [KEY]: selected }); current = selected; renderCurrent(); dialog.close(); }
      catch { $('.avatar-error').textContent = '保存失败，请刷新网页后重试。'; }
      finally { saving = false; setBusy(false); $('.avatar-save').textContent = '保存头像'; }
    };
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[KEY]) { current = clean(changes[KEY].newValue); renderCurrent(); }
    });
    currentImage.onerror = () => { currentImage.onerror = null; currentImage.src = chrome.runtime.getURL(fallback.path); currentImage.alt = '默认企鹅'; };
    return { async open() { await ready; open(); }, snapshot() { return { src: src(current), name: name(current) }; } };
  };
})();
