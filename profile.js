(() => {
  const KEY = 'qqProfile';
  const statuses = { online: '在线', busy: '忙碌', away: '离开' };
  const clean = value => ({
    nickname: (typeof value?.nickname === 'string' ? value.nickname.trim().slice(0, 24) : '') || 'QQ好友',
    signature: typeof value?.signature === 'string' ? value.signature.trim().slice(0, 80) : '',
    status: Object.hasOwn(statuses, value?.status) ? value.status : 'online'
  });
  const duration = ms => {
    const minutes = Math.floor(Math.max(0, Number(ms) || 0) / 60000);
    return `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分钟`;
  };
  const css = `
    .identity{margin:1px 0 8px;min-width:0}.identity-name{border:0;background:transparent;font-weight:700;font-size:15px;padding:1px 4px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:middle;border-radius:5px}.identity-name:hover{background:#ffffff70}.identity-signature{font-size:11px;color:#547791;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:1px 0 4px}.presence-button{display:inline-flex;align-items:center;gap:5px;border:1px solid #86b7d76b;border-radius:12px;padding:1px 9px;background:#f6fcff80;font-size:11px}.presence-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#50bd27}.presence-dot[data-state=busy]{background:#ec6464}.presence-dot[data-state=away]{background:#edb337}.online[data-state=busy]{background:radial-gradient(circle at 30% 22%,#fff,#ff9292 28%,#dc4343 64%,#9c2828);border-color:#9c2828}.online[data-state=away]{background:radial-gradient(circle at 30% 22%,#fff,#ffe37a 28%,#e5a825 64%,#a57512);border-color:#a57512}.open-profile{border:1px solid #72a9d0;border-radius:7px;background:linear-gradient(#fff,#c3e3f8);padding:6px 12px;margin:4px 6px 8px 0}.toast{top:auto;bottom:42px}
    :host([data-placement=compact]) .identity{margin:0}:host([data-placement=compact]) .identity-name{font-size:12px;max-width:90px}:host([data-placement=compact]) .identity-signature,:host([data-placement=compact]) .presence-button{display:none}
    .profile-dialog{color:#23577e;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;position:fixed;inset:0;margin:auto;width:min(440px,calc(100vw - 24px));max-height:calc(100dvh - 32px);padding:0;border:1px solid #62a7dc;border-radius:16px;background:linear-gradient(140deg,#f5fcff,#cce8fb);box-shadow:inset 0 0 0 1px white,0 20px 70px #153d6966;overflow:hidden}.profile-dialog::backdrop{background:#143f664d;backdrop-filter:blur(3px)}.profile-layout{display:flex;flex-direction:column;max-height:calc(100dvh - 36px)}.profile-head{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #82b8de66}.profile-head strong{font-size:17px}.profile-body{padding:18px;min-height:0;overflow:auto;overscroll-behavior:contain}.profile-dialog button{font:inherit;color:inherit;border:1px solid #72a9d0;border-radius:7px;background:linear-gradient(#fff,#c3e3f8);padding:6px 12px;cursor:pointer}.profile-dialog button:focus-visible,.identity button:focus-visible{outline:3px solid #258bd0;outline-offset:2px}.profile-summary{display:flex;align-items:center;gap:18px;margin-bottom:18px}.profile-dialog .profile-avatar{flex-shrink:0;padding:5px;background:#e8f6ff;border-radius:12px}.profile-avatar img{display:block;width:76px;height:76px;object-fit:contain;border-radius:6px}.profile-avatar span{font-size:11px;display:block;margin-top:3px}.profile-stats{min-width:0}.profile-rank{display:flex;gap:3px;flex-wrap:wrap;margin:3px 0}.profile-rank svg{width:26px;height:26px}.profile-total,.profile-clock{font-size:12px;color:#54718b}.profile-label{display:flex;justify-content:space-between;gap:8px;font-size:13px;margin:12px 0 5px}.profile-count{color:#7390a4;font-size:11px}.profile-dialog input,.profile-dialog textarea{display:block;box-sizing:border-box;width:100%;font:inherit;color:#23577e;background:#fff9;border:1px solid #92bad6;border-radius:7px;padding:9px 10px;outline:none}.profile-dialog input:focus,.profile-dialog textarea:focus{border-color:#268bd0;box-shadow:0 0 0 2px #258bd029}.profile-dialog textarea{resize:vertical;min-height:76px;max-height:160px}.profile-statuses{display:flex;gap:7px;flex-wrap:wrap}.profile-statuses button{display:flex;align-items:center;gap:6px;flex:1;justify-content:center;font-size:13px;padding:6px 8px}.profile-statuses button[aria-pressed=true]{outline:2px solid #258bd0;background:#b8e2ff}.profile-note{font-size:11px;color:#54718b;margin:14px 0 0}.profile-error{color:#a13625;font-size:12px;min-height:18px;margin-top:5px}.profile-foot{display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid #82b8de66}.profile-foot .profile-save{background:linear-gradient(#6bc9ff,#1686d6);color:#fff;border-color:#187ac0}.profile-dialog button:disabled{opacity:.5;cursor:wait}@media(max-width:410px){.profile-body{padding:12px}.profile-summary{gap:12px}.profile-foot{padding:10px 12px}}
  `;
  window.QQProfileCard = function(root, avatars) {
    const style = document.createElement('style'); style.textContent = css; root.append(style);
    const identity = document.createElement('div'); identity.className = 'identity';
    identity.innerHTML = `<button type="button" class="identity-name" aria-label="打开个人资料">QQ好友</button><div class="identity-signature">编辑你的个性签名</div><button type="button" class="presence-button" aria-label="修改在线状态"><span class="presence-dot"></span><span class="presence-text">在线</span><span aria-hidden="true">⌄</span></button>`;
    root.querySelector('.avatar').after(identity);
    const settingsButton = document.createElement('button'); settingsButton.className = 'open-profile'; settingsButton.textContent = '个人资料';
    root.querySelector('.change-avatar').before(settingsButton);
    const dialog = document.createElement('dialog'); dialog.className = 'profile-dialog'; dialog.setAttribute('aria-label', '个人资料');
    dialog.innerHTML = `<div class="profile-layout"><div class="profile-head"><strong>个人资料</strong><button type="button" class="profile-close" aria-label="关闭个人资料">×</button></div><div class="profile-body"><div class="profile-summary"><button type="button" class="profile-avatar" aria-label="更换资料卡头像"><img alt="当前头像"><span>更换头像</span></button><div class="profile-stats"><strong class="profile-level">正在读取等级…</strong><div class="profile-rank" aria-label="等级图标"></div><div class="profile-total"></div><div class="profile-clock"></div></div></div><form class="profile-form" id="qq-profile-form"><label class="profile-label" for="qq-nickname">昵称<span class="profile-count nickname-count">0 / 24</span></label><input id="qq-nickname" name="nickname" maxlength="24" placeholder="给自己起个名字" autocomplete="off"><label class="profile-label" for="qq-signature">个性签名<span class="profile-count signature-count">0 / 80</span></label><textarea id="qq-signature" name="signature" maxlength="80" placeholder="写一句今天想说的话"></textarea><div class="profile-label" id="qq-presence-label">我的状态</div><div class="profile-statuses" role="group" aria-labelledby="qq-presence-label"></div><p class="profile-note">资料仅在本机显示，状态不影响等级计时。</p><div class="profile-error" role="status" aria-live="polite"></div></form></div><div class="profile-foot"><button type="button" class="profile-cancel">取消</button><button type="submit" form="qq-profile-form" class="profile-save">保存资料</button></div></div>`;
    root.append(dialog);
    const $ = s => dialog.querySelector(s);
    let current = clean(), selected = current.status, saving = false, state = null;
    function renderIdentity() {
      identity.querySelector('.identity-name').textContent = current.nickname;
      identity.querySelector('.identity-name').title = current.nickname + ' · 个人资料';
      const signature = identity.querySelector('.identity-signature'); signature.textContent = current.signature || '编辑你的个性签名'; signature.title = current.signature;
      identity.querySelector('.presence-text').textContent = statuses[current.status];
      identity.querySelector('.presence-dot').dataset.state = current.status;
      const dot = root.querySelector('.online'); dot.dataset.state = current.status; dot.classList.remove('off'); dot.title = statuses[current.status];
    }
    function renderAvatar() { const avatar = avatars.snapshot(); $('.profile-avatar img').src = avatar.src; $('.profile-avatar img').alt = avatar.name; }
    function renderStats() {
      if (!state) return;
      $('.profile-level').textContent = `Lv.${state.rank.level}${state.demo ? ' · 测试等级' : ''}`;
      $('.profile-rank').innerHTML = window.QQRetroIcons.rankIcons(state.rank);
      $('.profile-rank').setAttribute('aria-label', `${state.rank.crowns} 皇冠 ${state.rank.suns} 太阳 ${state.rank.moons} 月亮 ${state.rank.stars} 星星`);
      $('.profile-total').textContent = '正式累计 ' + duration(state.totalMs);
      $('.profile-clock').textContent = state.active ? '正在累计时长' : '时长累计已暂停';
    }
    function counts() { $('.nickname-count').textContent = `${$('#qq-nickname').value.length} / 24`; $('.signature-count').textContent = `${$('#qq-signature').value.length} / 80`; }
    function statusButtons() { for (const b of $('.profile-statuses').children) b.setAttribute('aria-pressed', String(b.dataset.state === selected)); }
    function close() { if (!saving) dialog.close(); }
    const ready = chrome.storage.local.get(KEY).then(data => { current = clean(data[KEY]); renderIdentity(); }).catch(() => { $('.profile-error').textContent = '读取资料失败，请刷新重试。'; });
    async function open() {
      await ready; if (dialog.open) return;
      $('#qq-nickname').value = current.nickname; $('#qq-signature').value = current.signature; selected = current.status;
      $('.profile-error').textContent = ''; counts(); statusButtons(); renderAvatar(); renderStats(); dialog.showModal();
    }
    for (const [value, label] of Object.entries(statuses)) {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.state = value; button.innerHTML = `<span class="presence-dot" data-state="${value}" aria-hidden="true"></span>`; button.append(label);
      button.onclick = () => { if (!saving) { selected = value; statusButtons(); } }; $('.profile-statuses').append(button);
    }
    identity.querySelector('.identity-name').onclick = identity.querySelector('.presence-button').onclick = settingsButton.onclick = open;
    $('.profile-avatar').onclick = () => avatars.open();
    $('.profile-close').onclick = $('.profile-cancel').onclick = close;
    $('#qq-nickname').oninput = $('#qq-signature').oninput = counts;
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('keydown', event => event.stopPropagation());
    $('.profile-form').onsubmit = async event => {
      event.preventDefault(); if (saving) return;
      if (!$('#qq-nickname').value.trim()) { $('.profile-error').textContent = '先给自己起个昵称吧。'; $('#qq-nickname').focus(); return; }
      const value = clean({ nickname: $('#qq-nickname').value, signature: $('#qq-signature').value, status: selected });
      saving = true; $('.profile-save').disabled = true; $('.profile-save').textContent = '保存中…';
      try { await chrome.storage.local.set({ [KEY]: value }); current = value; renderIdentity(); dialog.close(); }
      catch { $('.profile-error').textContent = '保存失败，资料还在这里，可以重试。'; }
      finally { saving = false; $('.profile-save').disabled = false; $('.profile-save').textContent = '保存资料'; }
    };
    root.addEventListener('qq-avatar-changed', renderAvatar);
    chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes[KEY]) { current = clean(changes[KEY].newValue); renderIdentity(); } });
    renderIdentity(); renderAvatar();
    return { open, render(value) { state = value; if (dialog.open) renderStats(); } };
  };
})();
