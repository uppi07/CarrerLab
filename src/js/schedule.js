import { supabase } from './config.js';
import { A } from './state.js';
import { toast, ai, parseArr } from './utils.js';
import { goToChat } from './chat.js';
import { saveSchedule, updateScheduleProgress } from './data.js';

export function buildSidebar() {
  const list = document.getElementById('day-list');
  list.innerHTML = '';
  A.plan.forEach((d,i) => {
    const el = document.createElement('div');
    el.className = 'day-item' + (A.done.has(i) ? ' done' : '');
    el.id = 'di-'+i;
    el.innerHTML = `<div class="day-n">Day ${d.day}</div><div class="day-t">${d.topic}</div>`;
    el.onclick = () => selectDay(i);
    list.appendChild(el);
  });
  updateProg();
}

export function selectDay(i) {
  document.querySelectorAll('.day-item').forEach(e=>e.classList.remove('active'));
  document.getElementById('di-'+i)?.classList.add('active');
  A.currentDay = i;
  renderDay(i);
}

function updateProg() {
  const p = A.plan.length ? (A.done.size/A.plan.length)*100 : 0;
  document.getElementById('prog-fill').style.width = p+'%';
}

function renderDay(i) {
  const d = A.plan[i]; if (!d) return;
  const done = A.done.has(i);
  const step = A.lessonStep[i] ?? 0;
  const lesson = A.lessons[i] || null;

  document.getElementById('day-content').innerHTML = `
    <div class="day-ey">Day ${d.day} of ${A.plan.length}</div>
    <div class="day-h">${d.topic}</div>
    <div class="tags">
      <span class="tag">${done ? '✓ Completed' : 'In progress'}</span>
      ${lesson ? '<span class="tag" style="border-color:rgba(124,106,255,.3);color:var(--a2)">Lesson loaded</span>' : ''}
    </div>
    <div class="step-bar">
      <button class="step-tab ${step===0?'active':''} ${done?'done-tab':''}" onclick="window.switchStep(${i},0)">① Learn</button>
      <button class="step-tab ${step===1?'active':''} ${done?'done-tab':''}" onclick="window.switchStep(${i},1)">② Practice</button>
      <button class="step-tab ${step===2?'active':''} ${done?'done-tab':''}" onclick="window.switchStep(${i},2)">③ Task</button>
    </div>
    <div id="step-body">${renderStep(i,step,d,lesson,done)}</div>`;
}

function renderStep(i,step,d,lesson,done) {
  if (step===0) return renderLearn(i,d,lesson);
  if (step===1) return renderPractice(i,d,lesson);
  return renderTask(i,d,done);
}

function renderLearn(i,d,lesson) {
  if (!lesson) return `
    <div class="card" style="text-align:center;padding:30px 24px">
      <div style="font-size:13px;color:var(--muted);margin-bottom:18px;line-height:1.7">
        Claude will write a <strong style="color:var(--a2)">complete lesson</strong> on
        <strong style="color:var(--a2)">${d.topic}</strong> — concepts, examples, how to apply it,
        common mistakes. No need to open another tab.
      </div>
      <button class="gen-btn" id="gen-btn" onclick="window.loadLesson(${i})">
        <span class="gen-spin"></span>
        <span class="gen-lbl">Teach me ${d.topic}</span>
      </button>
    </div>`;
  return `
    <div class="card">
      <div class="card-lbl">Lesson — ${d.topic}</div>
      <div class="lesson-text">${lesson.content}</div>
    </div>
    <button class="btn btn-accent" style="width:100%;padding:13px;font-size:13px;margin-top:4px"
      onclick="window.switchStep(${i},1)">I've read this → test me →</button>`;
}

function renderPractice(i,d,lesson) {
  if (!lesson) return `<div class="card" style="text-align:center;padding:22px">
    <div style="font-size:13px;color:var(--muted);margin-bottom:14px">Load the lesson first.</div>
    <button class="btn btn-ghost" onclick="window.switchStep(${i},0)">← Learn first</button></div>`;
  const qs = lesson.quiz||[];
  if (!qs.length) return `<div class="card"><div style="font-size:13px;color:var(--muted)">No quiz — <span style="cursor:pointer;color:var(--a2)" onclick="window.switchStep(${i},2)">go to task →</span></div></div>`;
  return `
    ${qs.map((q,qi)=>`
      <div class="quiz-q" id="qq-${i}-${qi}">
        <div class="quiz-qt">${qi+1}. ${q.question}</div>
        <div class="quiz-opts">
          ${(q.options||[]).map((o,oi)=>`<button class="qopt" id="qo-${i}-${qi}-${oi}" onclick="window.answerQ(${i},${qi},${oi},${q.correct})">${o}</button>`).join('')}
        </div>
        <div class="qfb" id="qf-${i}-${qi}"></div>
      </div>`).join('')}
    <button class="btn btn-accent" style="width:100%;padding:13px;margin-top:8px;font-size:13px"
      onclick="window.switchStep(${i},2)">Done → go to task →</button>`;
}

function renderTask(i,d,done) {
  return `
    <div class="card">
      <div class="card-lbl">Today's task</div>
      <div class="task-text">${d.task}</div>
    </div>
    <div class="card">
      <div class="card-lbl">Objectives</div>
      <ul class="obj-list">
        ${d.objectives.map((o,j)=>`
          <li>
            <div class="chk ${done?'on':''}" id="chk-${i}-${j}" onclick="window.toggleChk(${i},${j})"></div>
            <span>${o}</span>
          </li>`).join('')}
      </ul>
    </div>
    ${!done
      ? `<button class="complete-btn" onclick="window.markDone(${i})">Mark Day ${d.day} complete → enter challenge →</button>`
      : `<div style="text-align:center;padding:13px;font-size:12px;color:var(--green)">Day ${d.day} complete ✓ — <span style="cursor:pointer;text-decoration:underline" onclick="window.goToChat()">Enter challenge room</span></div>`}`;
}

export function switchStep(i,step){
  A.lessonStep[i]=step;
  renderDay(i);
  updateScheduleProgress();
}
export function toggleChk(di,oi){ document.getElementById(`chk-${di}-${oi}`)?.classList.toggle('on'); }

export function answerQ(di,qi,chosen,correct) {
  const right = chosen===correct;
  for(let oi=0;oi<4;oi++){ const b=document.getElementById(`qo-${di}-${qi}-${oi}`); if(b){b.disabled=true;b.style.cursor='default';} }
  document.getElementById(`qo-${di}-${qi}-${chosen}`)?.classList.add(right?'correct':'wrong');
  if (!right) document.getElementById(`qo-${di}-${qi}-${correct}`)?.classList.add('correct');
  const fb = document.getElementById(`qf-${di}-${qi}`);
  if (fb) {
    const q = A.lessons[di]?.quiz?.[qi];
    fb.textContent = right ? '✓ Correct! '+(q?.explanation||'') : '✗ Not quite. '+(q?.explanation||'');
    fb.className = `qfb show ${right?'ok':'bad'}`;
  }
}

export async function markDone(i) {
  A.done.add(i); A.currentDay=i;
  document.getElementById('di-'+i)?.classList.add('done');
  updateProg(); renderDay(i);

  await updateScheduleProgress();

  toast('Day '+A.plan[i].day+' complete!','ok');
  setTimeout(goToChat, 700);
}

export async function loadLesson(i) {
  const d = A.plan[i]; if (!d) return;
  const btn = document.getElementById('gen-btn');
  if (btn) { btn.disabled=true; btn.classList.add('loading'); btn.querySelector('.gen-lbl').textContent='Building lesson…'; }

  const sys = `Expert tutor. Output two blocks with delimiters. Nothing outside the blocks.

##LESSON##
(HTML here)
##END##

##QUIZ##
(JSON array here)
##ENDQUIZ##`;

  const msg = `Lesson on "${d.topic}" for ${A.name} targeting "${A.role}".
JD: ${A.jd.substring(0,350)}

##LESSON## — HTML only, 550-650 words, these 7 sections:
<h3>What is ${d.topic}?</h3>
<h3>Why this matters for your role</h3>
<h3>Core concepts</h3> (3-4 with analogies)
<h3>Real-world example</h3> (named company, step by step)
<h3>How to apply this</h3> (numbered steps)
<h3>Common mistakes</h3> (3 mistakes)
<h3>Key terms</h3> (4-5 with definitions)
Use single quotes inside text only.

##QUIZ## — JSON array, 3 scenario questions:
[{"question":"scenario","options":["A","B","C","D"],"correct":1,"explanation":"why in 2 sentences"}]
correct index 0-3 varied.

Write both blocks now:`;

  try {
    const raw = await ai([{role:'user',content:msg}], sys, 2800);
    const lm = raw.match(/##LESSON##([\s\S]*?)##END##/);
    const qm = raw.match(/##QUIZ##([\s\S]*?)##ENDQUIZ##/);
    let content = lm ? lm[1].trim().replace(/^```html?\s*/i,'').replace(/\s*```$/i,'').trim() : raw.replace(/##.*?##/g,'').trim();
    let quiz = [];
    if (qm) { try { quiz = parseArr(qm[1].trim()); } catch(e){ console.warn('quiz parse:',e.message); } }
    A.lessons[i] = { content, quiz: Array.isArray(quiz)?quiz:[] };
    A.lessonStep[i] = 0;

    await updateScheduleProgress();

    renderDay(i);
    toast('Lesson ready!','ok');
  } catch(e) {
    toast('Lesson failed: '+e.message,'err');
    if (btn) { btn.disabled=false; btn.classList.remove('loading'); btn.querySelector('.gen-lbl').textContent='Retry'; }
  }
}
