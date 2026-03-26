import { A } from './state.js';
import { go, toast, ai } from './utils.js';

export function goToChat() {
  const i = A.currentDay!==null ? A.currentDay : 0;
  const d = A.plan[i]; if (!d) return toast('Generate plan first','err');
  document.getElementById('chat-topic').textContent = `Day ${d.day}: ${d.topic}`;
  A.chatHistory = [];
  document.getElementById('messages').innerHTML = '';
  go('s4');
  openChallenge(d);
}

function chatSys(d) {
  return `You are a rotating panel of senior professionals at a tech company doing a knowledge standup with ${A.name}, who just studied "${d.topic}" for the role "${A.role}".
Rotate between Sara (Senior Engineer), Marcus (Product Lead), Jasmine (Data Analyst).
Ask sharp practical scenario questions. Push back on vague answers. 3-5 sentences per message.`;
}

async function openChallenge(d) {
  showTyping();
  try {
    const r = await ai([{role:'user',content:`Greet ${A.name} warmly then ask ONE sharp practical question about "${d.topic}". Max 4 sentences.`}], chatSys(d), 350);
    hideTyping(); addMsg('ai',r,'Sara R. · Senior Engineer');
    A.chatHistory.push({role:'assistant',content:r});
  } catch(e) { hideTyping(); addMsg('ai',`Hey ${A.name}! Let's talk about ${d.topic}.`,'Sara R.'); }
}

export async function sendMsg() {
  if (A.busy) return;
  const inp = document.getElementById('chat-input');
  const txt = inp.value.trim(); if (!txt) return;
  const d = A.plan[A.currentDay||0];
  inp.value=''; inp.style.height='auto';
  addMsg('user',txt,A.name||'You');
  A.chatHistory.push({role:'user',content:txt});
  A.busy=true; document.getElementById('send-btn').disabled=true;
  showTyping();
  try {
    const r = await ai(A.chatHistory, chatSys(d), 450);
    hideTyping();
    const tms=['Sara R. · Senior Engineer','Marcus K. · Product Lead','Jasmine L. · Data Analyst'];
    addMsg('ai',r,tms[Math.floor(A.chatHistory.length/2)%3]);
    A.chatHistory.push({role:'assistant',content:r});
  } catch(e) { hideTyping(); addMsg('ai','Connection issue — try again?','System'); }
  finally { A.busy=false; document.getElementById('send-btn').disabled=false; }
}

let typingEl=null;
function showTyping(){
  const msgs=document.getElementById('messages');
  typingEl=document.createElement('div'); typingEl.className='msg ai'; typingEl.id='typing';
  typingEl.innerHTML=`<div class="msg-av" style="background:rgba(124,106,255,.15);color:var(--a2)">SR</div><div class="bubble"><div class="typing-wrap"><span class="tdot"></span><span class="tdot"></span><span class="tdot"></span></div></div>`;
  msgs.appendChild(typingEl); msgs.scrollTop=msgs.scrollHeight;
}
function hideTyping(){ document.getElementById('typing')?.remove(); }
function addMsg(type,text,name){
  const msgs=document.getElementById('messages');
  const div=document.createElement('div'); div.className='msg '+type;
  const init=name?name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase():'?';
  const avBg={'SR':'rgba(124,106,255,.15)','MK':'rgba(34,211,160,.1)','JL':'rgba(245,158,11,.1)'}[init]||'rgba(124,106,255,.15)';
  const avTx={'SR':'var(--a2)','MK':'var(--green)','JL':'var(--amber)'}[init]||'var(--a2)';
  div.innerHTML=`
    <div class="msg-av" style="background:${type==='user'?'var(--accent)':avBg};color:${type==='user'?'#fff':avTx}">
      ${type==='user'?(A.name?A.name[0].toUpperCase():'U'):init}
    </div>
    <div>
      <div class="bubble">${text.replace(/\n/g,'<br>')}</div>
      <div class="msg-name">${name}</div>
    </div>`;
  msgs.appendChild(div); msgs.scrollTop=msgs.scrollHeight;
}

export function handleKey(e){ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();} }
export function autoResize(el){ el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,120)+'px'; }
