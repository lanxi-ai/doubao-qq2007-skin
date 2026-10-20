export const LEVEL_MS = 30 * 60 * 1000;
export const MAX_GAP_MS = 75000;
export const THEMES = [
  {id:'blue', name:'晴空蓝', level:0},
  {id:'gold', name:'日光金', level:1},
  {id:'mint', name:'薄荷绿', level:4}
];
export function clean(raw = {}) {
  const number = n => Number.isFinite(n) && n >= 0 ? Math.min(n, Number.MAX_SAFE_INTEGER / 2) : 0;
  return {version:1, totalMs:number(raw.totalMs), demoMs:number(raw.demoMs), demo:raw.demo === true,
    auto:raw.auto !== false, enabled:raw.enabled !== false,
    chosen:THEMES.some(t=>t.id===raw.chosen) ? raw.chosen : 'blue'};
}
export function rank(ms) {
  const level = Math.floor(ms / LEVEL_MS);
  const icons = '👑'.repeat(Math.min(8, Math.floor(level / 64))) + '☀️'.repeat(Math.floor(level % 64 / 16)) + '🌙'.repeat(Math.floor(level % 16 / 4)) + '⭐'.repeat(level % 4);
  return {level, icons:icons || '☆', progress:(ms % LEVEL_MS) / LEVEL_MS, remainingMs:LEVEL_MS - ms % LEVEL_MS,
    crowns:Math.floor(level/64), suns:Math.floor(level%64/16), moons:Math.floor(level%16/4), stars:level%4};
}
export function advance(raw, clock, now, eligible) {
  const state = clean(raw);
  const elapsed = clock ? now - clock.at : 0;
  // Long observation gaps are not credited: no offline/sleep catch-up.
  const credited = clock?.eligible && elapsed >= 0 && elapsed <= MAX_GAP_MS ? elapsed : 0;
  state.totalMs += credited;
  if (state.demo) state.demoMs += credited * 60;
  return {state, clock:{at:now, eligible}, credited};
}
export function chosenTheme(state) {
  const level = rank(state.demo ? state.demoMs : state.totalMs).level;
  const unlocked = THEMES.filter(t=>t.level<=level);
  return state.auto ? unlocked.at(-1).id : unlocked.find(t=>t.id===state.chosen)?.id || 'blue';
}
export function change(raw, command, value) {
  const state = clean(raw);
  if (command === 'DEMO') state.demo = Boolean(value);
  else if (command === 'DEMO_STEP') { if (!state.demo) throw Error('请先开启测试模式'); state.demoMs = (rank(state.demoMs).level + 1) * LEVEL_MS; }
  else if (command === 'DEMO_RESET') state.demoMs = 0;
  else if (command === 'AUTO') state.auto = Boolean(value);
  else if (command === 'ENABLED') state.enabled = Boolean(value);
  else if (command === 'THEME') {
    const item = THEMES.find(t=>t.id===value);
    if (!item || item.level>rank(state.demo ? state.demoMs : state.totalMs).level) throw Error('这个皮肤尚未解锁');
    state.chosen = value; state.auto = false;
  } else if (command !== 'SNAPSHOT') throw Error('不支持的操作');
  return state;
}
export function snapshot(state, eligible, reason) {
  const ms = state.demo ? state.demoMs : state.totalMs;
  return {...state, shownMs:ms, rank:rank(ms), theme:chosenTheme(state), themes:THEMES, active:eligible, reason};
}
