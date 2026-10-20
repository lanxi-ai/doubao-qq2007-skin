(() => {
  const KEY = 'qqFeedback';
  // New installs have reply audio on; an explicitly saved mute remains respected.
  const clean = v => ({ replySound: v?.replySound !== false, upgradeSound: v?.upgradeSound === true, animation: v?.animation !== false, volume: Number.isFinite(v?.volume) ? Math.max(0, Math.min(100, v.volume)) : 35 });
  const css = `
    .settings{max-height:calc(100dvh - 135px);overflow-y:auto;overscroll-behavior:contain}.popup .settings{max-height:none;overflow:visible}.feedback-settings{border-top:1px solid #6a9bc344;margin-top:14px;padding-top:10px}.feedback-settings strong{font-size:13px}.feedback-settings .check{margin:8px 0}.feedback-volume{display:flex;gap:8px;align-items:center;margin:10px 0;font-size:12px}.feedback-volume input{min-width:0;flex:1;width:80px;accent-color:#258bd0}.feedback-buttons{display:flex;gap:7px;flex-wrap:wrap}.feedback-buttons button{border:1px solid #70a9d2;border-radius:7px;background:linear-gradient(#fff,#c1e1f8);padding:6px 8px;font-size:12px}.audio-status{font-size:11px;line-height:1.6;margin-top:9px;color:#4e6e8a;min-height:18px}.celebration{position:fixed;inset:88px auto auto 50%;transform:translateX(-50%);margin:0;width:min(310px,calc(100vw - 32px));padding:16px 20px;border:1px solid #e3bc57;border-radius:18px;background:linear-gradient(125deg,#fffbe9f5,#fff1bdf5);box-shadow:inset 0 0 0 1px #fff,0 9px 35px #6b572c33;color:#795721;pointer-events:none;text-align:center;overflow:visible}.celebration::backdrop{display:none}.celebration-main svg{width:56px;height:56px;filter:drop-shadow(0 3px 2px #b2872b33)}.celebration-title{font-size:19px;font-weight:700;margin:1px 0 3px}.celebration-caption{font-size:12px}.celebration-particles{position:absolute;inset:0;pointer-events:none}.celebration-particles span{position:absolute;left:50%;top:42%;animation:qq-spark 1.25s ease-out both;animation-delay:var(--delay)}.celebration-particles svg{width:17px;height:17px}.celebration.motion .celebration-main{animation:qq-hop .65s ease-out}.celebration.motion{animation:qq-arrive .3s ease-out}@keyframes qq-spark{from{opacity:0;transform:translate(0,0) scale(.3)}25%{opacity:1}to{opacity:0;transform:translate(var(--x),var(--y)) rotate(70deg) scale(.7)}}@keyframes qq-hop{0%{transform:scale(.5)}45%{transform:scale(1.2) translateY(-5px)}75%{transform:scale(.95)}100%{transform:scale(1)}}@keyframes qq-arrive{from{opacity:0;margin-top:10px}to{opacity:1;margin-top:0}}@media(prefers-reduced-motion:reduce){.celebration,.celebration *{animation:none!important}.celebration-particles{display:none}}
  `;
  window.QQFeedback = function(root, isPopup) {
    const style = document.createElement('style'); style.textContent = css; root.append(style);
    const controls = document.createElement('div'); controls.className = 'feedback-settings';
    controls.innerHTML = `<strong>声音与动效</strong><label class="check"><input type="checkbox" class="reply-sound">回复完成提示音 · 经典滴滴滴</label><label class="check"><input type="checkbox" class="upgrade-sound">升级提示音</label><label class="check"><input type="checkbox" class="upgrade-animation">升级庆祝动画</label><label class="feedback-volume">音量<input type="range" min="0" max="100" step="5" value="35" aria-label="提示音音量"><span class="volume-value">35%</span></label><div class="feedback-buttons"><button class="preview-reply">试听回复音</button><button class="preview-upgrade">预览升级</button></div><div class="audio-status" role="status" aria-live="polite">回复音默认开启，正常聊天即可。</div>`;
    root.querySelector('.settings .test').before(controls);
    const box = document.createElement('div'); box.className = 'celebration'; box.popover = 'manual'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite');
    box.innerHTML = `<div class="celebration-particles" aria-hidden="true"></div><div class="celebration-main"></div><div class="celebration-title"></div><div class="celebration-caption"></div>`; root.append(box);
    const $ = selector => controls.querySelector(selector);
    let prefs = clean(), context = null, loaded = false, saving = false, enabled = true, last = null, hideTimer, lastSound = -Infinity;
    let replyBuffer = null, replyLoading = null, soundRevision = 0;
    const nodes = new Set();
    function hint(text) { $('.audio-status').textContent = text; }
    function renderPrefs() { $('.reply-sound').checked = prefs.replySound; $('.upgrade-sound').checked = prefs.upgradeSound; $('.upgrade-animation').checked = prefs.animation; $('input[type=range]').value = prefs.volume; $('.volume-value').textContent = `${prefs.volume}%`; }
    function stopSound() { soundRevision++; for (const node of nodes) { try { node.stop(); } catch {} } nodes.clear(); }
    function loadReplyBuffer() {
      if (replyBuffer) return Promise.resolve(replyBuffer);
      if (!replyLoading) {
        const audioContext = context;
        // Bundled audio only: no third-party requests during use.
        replyLoading = fetch(chrome.runtime.getURL('assets/audio/qq-message.wav'))
          .then(response => { if (!response.ok) throw new Error('audio unavailable'); return response.arrayBuffer(); })
          .then(bytes => audioContext.decodeAudioData(bytes))
          .then(buffer => (replyBuffer = buffer))
          .catch(() => { hint('回复音加载失败，请重新加载插件后刷新网页。'); return null; })
          .finally(() => { replyLoading = null; });
      }
      return replyLoading;
    }
    function audioReady() {
      try {
        if (!context || context.state === 'closed') { context = new AudioContext(); context.addEventListener('statechange', () => { if (context.state === 'running') hint('本页声音已就绪'); }); }
        if (context.state === 'suspended') context.resume().catch(() => hint('点击网页或继续打字后即可播放回复音。'));
        if (prefs.replySound) loadReplyBuffer();
      } catch { hint('浏览器暂时不能播放声音。'); }
    }
    async function play(kind, preview = false) {
      if (!preview && (!enabled || !prefs[kind === 'reply' ? 'replySound' : 'upgradeSound'])) return false;
      if (prefs.volume <= 0) { hint('当前音量为 0。'); return false; }
      if (!context || context.state !== 'running') { hint('点击网页或继续打字后即可播放回复音。'); return false; }
      const audioContext = context, revision = soundRevision;
      const buffer = kind === 'reply' ? await loadReplyBuffer() : null;
      // Loading can finish after mute, volume zero, skin disabled, or another sound.
      if (revision !== soundRevision || context !== audioContext || context.state !== 'running' || kind === 'reply' && !buffer) return false;
      if (prefs.volume <= 0 || !preview && (!enabled || !prefs[kind === 'reply' ? 'replySound' : 'upgradeSound'])) return false;
      if (!preview && performance.now() - lastSound < 800) return false;
      lastSound = performance.now(); stopSound();
      if (kind === 'reply') {
        const source = context.createBufferSource(), gain = context.createGain();
        source.buffer = buffer; gain.gain.value = prefs.volume / 100;
        source.connect(gain); gain.connect(context.destination); nodes.add(source);
        source.onended = () => { nodes.delete(source); source.disconnect(); gain.disconnect(); };
        source.start(context.currentTime + .015);
        hint('已触发经典滴滴滴回复音'); return true;
      }
      const tones = [[523.25, 0, .16], [659.25, .12, .16], [783.99, .24, .18], [1046.5, .38, .32]];
      for (const [hz, offset, length] of tones) {
        const oscillator = context.createOscillator(), gain = context.createGain(), at = context.currentTime + .015 + offset;
        oscillator.type = 'sine'; oscillator.frequency.value = hz; gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(prefs.volume / 100 * .16, at + .015); gain.gain.exponentialRampToValueAtTime(.0001, at + length);
        oscillator.connect(gain); gain.connect(context.destination); nodes.add(oscillator);
        oscillator.onended = () => { nodes.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(at); oscillator.stop(at + length + .02);
      }
      hint('已触发升级提示音'); return true;
    }
    function nudgeSound() {
      if (!enabled || prefs.volume <= 0) { hint('未回复提醒音量为 0 或皮肤已关闭'); return false; }
      if (!context || context.state !== 'running') { hint('请点击未回复提醒的试听按钮启用声音'); return false; }
      stopSound();
      // Two locally synthesized, filtered breath-like bursts. No QQ recording or network audio.
      for (const offset of [0, .26]) {
        const length=.18, buffer=context.createBuffer(1,Math.ceil(context.sampleRate*length),context.sampleRate), data=buffer.getChannelData(0);
        for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(.65+.35*Math.sin(i/context.sampleRate*2*Math.PI*85));
        const source=context.createBufferSource(), filter=context.createBiquadFilter(), gain=context.createGain(), at=context.currentTime+.02+offset;
        source.buffer=buffer;filter.type='bandpass';filter.frequency.value=780;filter.Q.value=.65;
        gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(prefs.volume/100*.45,at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+length);
        source.connect(filter);filter.connect(gain);gain.connect(context.destination);nodes.add(source);
        source.onended=()=>{nodes.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start(at);
      }
      hint('已触发五分钟未回复提示音');return true;
    }
    async function save(partial) {
      if (saving) return;
      const before = prefs; prefs = clean({ ...prefs, ...partial }); renderPrefs(); saving = true;
      for (const input of controls.querySelectorAll('input')) input.disabled = true;
      try { await chrome.storage.local.set({ [KEY]: prefs }); }
      catch { prefs = before; renderPrefs(); hint('设置保存失败，请重试。'); }
      finally { saving = false; for (const input of controls.querySelectorAll('input')) input.disabled = false; }
    }
    function hide() { clearTimeout(hideTimer); if (box.matches(':popover-open')) box.hidePopover(); }
    function celebrate(rank, preview = false) {
      if (root.querySelector('dialog[open]') || !preview && (!enabled || !prefs.animation)) return;
      hide(); const level = rank.level;
      const kind = level > 0 && level % 64 === 0 ? 'crown' : level > 0 && level % 16 === 0 ? 'sun' : level > 0 && level % 4 === 0 ? 'moon' : 'star';
      box.querySelector('.celebration-main').innerHTML = window.QQRetroIcons.icon(kind);
      box.querySelector('.celebration-title').textContent = preview ? '升级效果预览' : `升级啦！Lv.${level}`;
      box.querySelector('.celebration-caption').textContent = preview ? '仅预览，不增加等级' : ({ star: '又攒到一颗星星', moon: '星星点亮了月亮', sun: '月亮汇成了太阳', crown: '皇冠到手啦' })[kind];
      const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      box.classList.toggle('motion', motion);
      box.querySelector('.celebration-particles').innerHTML = motion ? Array.from({length:8}, (_, i) => `<span style="--x:${Math.cos(i * Math.PI / 4) * 120}px;--y:${Math.sin(i * Math.PI / 4) * 95}px;--delay:${i % 3 * .06}s">${window.QQRetroIcons.icon('star')}</span>`).join('') : '';
      box.showPopover(); hideTimer = setTimeout(hide, 2800);
    }
    $('.reply-sound').onchange = event => { if (event.target.checked) audioReady(); else stopSound(); save({ replySound: event.target.checked }); };
    $('.upgrade-sound').onchange = event => { if (event.target.checked) audioReady(); else stopSound(); save({ upgradeSound: event.target.checked }); };
    $('.upgrade-animation').onchange = event => { if (!event.target.checked) hide(); save({ animation: event.target.checked }); };
    $('input[type=range]').oninput = event => { $('.volume-value').textContent = `${event.target.value}%`; if (+event.target.value === 0) stopSound(); };
    $('input[type=range]').onchange = event => save({ volume: +event.target.value });
    $('.preview-reply').onclick = async () => { audioReady(); if (context) await context.resume().catch(() => {}); play('reply', true); };
    $('.preview-upgrade').onclick = async () => { celebrate(last?.rank || {level:4}, true); if (prefs.upgradeSound) { audioReady(); if (context) await context.resume().catch(() => {}); play('upgrade', true); } };
    const ready = chrome.storage.local.get(KEY).then(data => { prefs = clean(data[KEY]); loaded = true; renderPrefs(); if (!prefs.replySound && !prefs.upgradeSound || prefs.volume === 0) stopSound(); hint(prefs.replySound ? '回复音已开启，正常聊天即可。' : '回复提示音已关闭。'); }).catch(() => { loaded = true; hint('声音设置读取失败，请刷新重试。'); });
    chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes[KEY]) { prefs = clean(changes[KEY].newValue); renderPrefs(); if (!prefs.replySound && !prefs.upgradeSound || prefs.volume === 0) stopSound(); if (!prefs.animation) hide(); } });
    // Preserve a very early real gesture, even while local preferences are loading.
    const unlock = event => { if (event.isTrusted && enabled && (prefs.replySound || prefs.upgradeSound)) audioReady(); };
    document.addEventListener('click', unlock, true); document.addEventListener('keydown', unlock, true);
    document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
    new MutationObserver(() => { if (root.querySelector('dialog[open]')) hide(); }).observe(root, {subtree:true, attributes:true, attributeFilter:['open']});
    renderPrefs();
    return {
      nudgeSound, prepareNudgeSound:audioReady, async previewNudgeSound(){audioReady();if(context)await context.resume().catch(()=>{});return nudgeSound();},
      async replyComplete() { await ready; return play('reply'); },
      render(state) {
        enabled = state.enabled;
        if (!enabled) { hide(); stopSound(); }
        if (loaded && !isPopup && !document.hidden && document.hasFocus() && last && last.demo === state.demo && last.enabled && enabled && state.rank.level > last.rank.level) { celebrate(state.rank); play('upgrade'); }
        last = state;
      }
    };
  };
})();
