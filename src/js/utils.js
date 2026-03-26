import { A } from './state.js';

export function go(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
  document.getElementById(id).classList.add('on');
  window.scrollTo(0,0);
}

export function toast(msg, type='') {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = 'toast show ' + type;
  setTimeout(() => el.classList.remove('show'), 3000);
}

export async function ai(messages, system, maxTokens=2000) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'x-api-key': A.api,
      'anthropic-version':'2023-06-01',
      'anthropic-dangerous-direct-browser-access':'true'
    },
    body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:maxTokens, system, messages })
  });
  if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e.error?.message || 'API error '+r.status); }
  return (await r.json()).content[0].text;
}

export function parseArr(raw) {
  let s = raw.trim().replace(/^```json?\s*/i,'').replace(/\s*```$/i,'').trim();
  const a = s.indexOf('['), b = s.lastIndexOf(']');
  if (a>-1&&b>a) s = s.slice(a,b+1);
  let p = JSON.parse(s);
  if (Array.isArray(p)&&p.length===1&&Array.isArray(p[0])) p=p[0];
  if (!Array.isArray(p)) throw new Error('not an array');
  return p;
}

export function parseObj(raw) {
  let s = raw.trim().replace(/^```json?\s*/i,'').replace(/\s*```$/i,'').trim();
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a>-1&&b>a) s = s.slice(a,b+1);
  try { return JSON.parse(s); } catch(_) {}
  let f = s.replace(/,\s*([\}\]])/g,'$1').replace(/([{\[,]\s*)([a-zA-Z_]\w*)\s*:/g,'$1"$2":').replace(/:\s*'([^']*)'/g,':"$1"').replace(/[\u0000-\u001F\u007F]/g,' ');
  try { return JSON.parse(f); } catch(_) {}
  throw new Error('JSON parse failed');
}

export function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
