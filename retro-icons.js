(() => {
 function icon(kind){
 const defs='<defs><linearGradient id="qq-gold" x2="0" y2="1"><stop stop-color="#fffbd1"/><stop offset=".38" stop-color="#ffe777"/><stop offset=".52" stop-color="#ffca34"/><stop offset="1" stop-color="#f5a811"/></linearGradient><radialGradient id="qq-sun" cx="35%" cy="28%"><stop stop-color="#fffbd2"/><stop offset=".58" stop-color="#ffd84f"/><stop offset="1" stop-color="#f6ac18"/></radialGradient></defs>';
 let shape='';
 if(kind==='star')shape='<path d="m32 4 8.2 18 19.8 2.2-14.8 13.4L49.5 57 32 47.3 14.5 57l4.3-19.4L4 24.2 23.8 22Z"/><path d="m32 10 6.5 16 15 1.8-20.7 5.7-7-7.8Z" fill="#fff9cc" stroke="none" opacity=".7"/>';
 if(kind==='moon')shape='<path d="M38 5C14 1 0 26 12 46c12 20 41 15 48-6C31 51 17 25 38 5Z"/><path d="M27 9C10 19 8 42 27 51" fill="none" stroke="#fff8c2" stroke-width="3"/>';
 if(kind==='sun'){shape=Array.from({length:12},(_,i)=>`<path d="m27 15 5-13 5 13Z" transform="rotate(${i*30} 32 32)"/>`).join('');shape+='<circle cx="32" cy="32" r="20" fill="url(#qq-sun)"/><path d="M17 29a15 15 0 0 1 22-10" fill="none" stroke="#fff7c4" stroke-width="3"/>';}
 if(kind==='crown')shape='<path d="m7 19 12 12L32 10l13 21 12-12-7 31H14Z"/><path d="M15 54h34" stroke-width="6"/><circle cx="7" cy="17" r="4"/><circle cx="32" cy="8" r="4"/><circle cx="57" cy="17" r="4"/><circle cx="32" cy="37" r="4" fill="#6dcfff"/>';
 if(kind==='empty')shape='<path d="m32 4 8.2 18 19.8 2.2-14.8 13.4L49.5 57 32 47.3 14.5 57l4.3-19.4L4 24.2 23.8 22Z" fill="#e8f5ff" stroke="#6cafe0"/>';
 return `<svg viewBox="0 0 64 64" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${defs}<g fill="url(#qq-gold)" stroke="#cc8617" stroke-width="1.6" stroke-linejoin="round">${shape}</g></svg>`;
 }
 function rankIcons(r){return ['crown','sun','moon','star'].map((k,i)=>Array.from({length:Math.min(8,[r.crowns,r.suns,r.moons,r.stars][i])},()=>icon(k)).join('')).join('')||icon('empty');}
 window.QQRetroIcons={icon,rankIcons};
})();
