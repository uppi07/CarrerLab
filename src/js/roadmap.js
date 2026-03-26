import { supabase } from './config.js';
import { A } from './state.js';
import { go, toast, ai, parseObj, sleep } from './utils.js';
import { saveRoadmap } from './data.js';

export async function buildRoadmap() {
  A.name = document.getElementById('user-name').value.trim();
  A.jd   = document.getElementById('jd-input').value.trim();
  A.role = document.getElementById('target-role').value.trim();
  A.days = parseInt(document.getElementById('timeframe').value);

  const errEl = document.getElementById('err-msg');
  errEl.style.display = 'none';

  if (!A.api)  return showErr('Claude API key not configured');
  if (!A.name) return showErr('Enter your name');
  if (!A.jd)   return showErr('Paste a job description');
  if (!A.role) return showErr('Enter your target role');

  if (A.roadmapId) {
    const confirmed = confirm('You already have a roadmap. Creating a new one will replace your existing roadmap and schedule. Continue?');
    if (!confirmed) return;
  }

  const btn = document.getElementById('s1-btn');
  btn.disabled = true;
  btn.textContent = 'Analysing…';

  await supabase.from('profiles').update({ name: A.name, role: A.role, days: A.days }).eq('id', A.userId);

  document.getElementById('s2-role-chip').textContent = A.role;
  document.getElementById('s3-role-chip').textContent = A.role;
  document.getElementById('rm-title').textContent = A.role + ' — Skill Roadmap';
  document.getElementById('rm-sub').textContent = 'Analysing your job description…';
  document.getElementById('rm-legend').innerHTML = '';
  renderSkeleton();
  go('s2');

  await generateRoadmap();
  await saveRoadmap(A.mmData);
  renderRoadmap();
  document.getElementById('s2-confirm-btn').disabled = false;
  toast('Roadmap ready!', 'ok');

  btn.disabled = false;
  btn.textContent = 'Build my skill roadmap →';
}

function showErr(msg) {
  const el = document.getElementById('err-msg');
  el.textContent = msg;
  el.style.display = 'block';
}

async function generateRoadmap(attempt=1) {
  const sys = `JSON generator. Return raw JSON only. Start with { end with }. No markdown. No explanation.`;
  const role = A.role.replace(/"/g,"'");
  const jd   = A.jd.substring(0,400).replace(/"/g,"'");

  const msg = `Create a skill roadmap for this role: ${role}
JD: ${jd}

Return this exact JSON with 5 clusters (priority 1-5, 4 skills each):
{"role":"${role}","clusters":[{"id":"c1","priority":1,"name":"Two Words","color":"#e879f9","skills":[{"id":"s1","name":"Skill","level":"foundation","desc":"five words only"}]}]}

MUST follow:
- name: 2 words max, letters only
- desc: 5 words max, letters and spaces only
- level: foundation intermediate or advanced only
- colors in order: #e879f9 #22d3a0 #f59e0b #60a5fa #f87171
- No commas quotes or apostrophes inside any string value
- Exactly 5 clusters and 4 skills each`;

  try {
    const raw = await ai([{role:'user',content:msg}], sys, 1000);
    const data = parseObj(raw);
    if (data && Array.isArray(data.clusters) && data.clusters.length > 0) {
      A.mmData = data;
      A.mmData.clusters.sort((a,b)=>(a.priority||0)-(b.priority||0));
      return;
    }
    throw new Error('No clusters in response');
  } catch(e) {
    console.warn('Roadmap attempt', attempt, 'failed:', e.message);
    if (attempt < 3) {
      await sleep(1000 * attempt);
      return generateRoadmap(attempt + 1);
    }
    console.warn('Using fallback roadmap for role:', A.role);
    A.mmData = buildFallbackRoadmap(A.role);
  }
}

function buildFallbackRoadmap(role) {
  return {
    role,
    clusters:[
      {id:'c1',priority:1,name:'Core Foundations',color:'#e879f9',skills:[
        {id:'s1',name:'Fundamentals',level:'foundation',desc:'Essential base knowledge for role'},
        {id:'s2',name:'Key Tools',level:'foundation',desc:'Standard tools used every day'},
        {id:'s3',name:'Core Concepts',level:'foundation',desc:'Theory and principles needed'},
        {id:'s4',name:'Best Practices',level:'foundation',desc:'Industry standard approaches used'}
      ]},
      {id:'c2',priority:2,name:'Technical Skills',color:'#22d3a0',skills:[
        {id:'s1',name:'Data Analysis',level:'intermediate',desc:'Working with data and metrics'},
        {id:'s2',name:'Primary Software',level:'intermediate',desc:'Main technical toolset mastery'},
        {id:'s3',name:'Process Workflows',level:'intermediate',desc:'Common repeatable processes'},
        {id:'s4',name:'Reporting',level:'foundation',desc:'Creating clear actionable reports'}
      ]},
      {id:'c3',priority:3,name:'Process Skills',color:'#f59e0b',skills:[
        {id:'s1',name:'Planning',level:'intermediate',desc:'Project and sprint planning'},
        {id:'s2',name:'Execution',level:'intermediate',desc:'Delivering work on schedule'},
        {id:'s3',name:'Prioritisation',level:'intermediate',desc:'Deciding what matters most'},
        {id:'s4',name:'Documentation',level:'foundation',desc:'Clear written communication skills'}
      ]},
      {id:'c4',priority:4,name:'Collaboration',color:'#60a5fa',skills:[
        {id:'s1',name:'Stakeholder Comms',level:'intermediate',desc:'Communicating with key people'},
        {id:'s2',name:'Team Skills',level:'intermediate',desc:'Working in cross functional teams'},
        {id:'s3',name:'Presentations',level:'intermediate',desc:'Presenting findings clearly'},
        {id:'s4',name:'Feedback Skills',level:'foundation',desc:'Giving and receiving feedback'}
      ]},
      {id:'c5',priority:5,name:'Advanced Mastery',color:'#f87171',skills:[
        {id:'s1',name:'Strategy',level:'advanced',desc:'Long term thinking and planning'},
        {id:'s2',name:'Leadership',level:'advanced',desc:'Leading projects and people'},
        {id:'s3',name:'Innovation',level:'advanced',desc:'Finding better approaches'},
        {id:'s4',name:'Mentoring',level:'advanced',desc:'Helping others grow quickly'}
      ]}
    ]
  };
}

function renderSkeleton() {
  const grid = document.getElementById('rm-grid');
  const colors = ['#e879f9','#22d3a0','#f59e0b','#60a5fa','#f87171'];
  grid.innerHTML = [0,1,2,3,4].map(i => `
    <div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:11px">
        <div class="skel" style="width:30px;height:30px;border-radius:50%;flex-shrink:0;border:1.5px solid ${colors[i]}44"></div>
        <div>
          <div class="skel" style="width:${110+i*22}px;height:14px;border-radius:5px;margin-bottom:6px"></div>
          <div class="skel" style="width:${80+i*14}px;height:10px;border-radius:4px"></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:9px">
        ${[0,0,0,0].map(()=>`<div class="skel" style="height:68px;border-radius:0 9px 9px 0;border-left:3px solid ${colors[i]}33"></div>`).join('')}
      </div>
    </div>
  `).join('<div style="height:1px;background:var(--b)"></div>');
}

function renderRoadmap() {
  const data = A.mmData;
  const totalSkills = data.clusters.reduce((a,c)=>a+(c.skills||[]).length,0);
  document.getElementById('rm-title').textContent = data.role + ' — Skill Roadmap';
  document.getElementById('rm-sub').textContent = `${data.clusters.length} skill clusters · ${totalSkills} skills · ordered by learning priority`;

  document.getElementById('rm-legend').innerHTML = data.clusters.map(c=>
    `<div class="leg-item"><div class="leg-dot" style="background:${c.color}"></div>${c.name}</div>`
  ).join('');

  const priLabels = ['Start here','Learn next','Then this','After that','Finally'];
  const grid = document.getElementById('rm-grid');
  grid.innerHTML = '';

  data.clusters.forEach((cluster, ci) => {
    const col    = cluster.color || '#7c6aff';
    const skills = cluster.skills || [];
    const label  = priLabels[ci] || `Step ${ci+1}`;

    const sec = document.createElement('div');
    sec.className = 'cluster-section';

    sec.innerHTML = `
      <div class="cluster-hd">
        <div class="cluster-num" style="background:${col}20;border:1.5px solid ${col};color:${col}">${cluster.priority||ci+1}</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:4px">
            <div class="cluster-name" style="color:${col}">${cluster.name}</div>
            <div class="cluster-badge" style="background:${col}18;border:1px solid ${col}40;color:${col}">${label}</div>
            <div style="font-size:11px;color:var(--dim);font-weight:600;text-transform:uppercase;letter-spacing:.5px">${skills.length} skills</div>
          </div>
        </div>
      </div>
      <div class="skills-grid" id="sg-${ci}"></div>
      ${ci < data.clusters.length-1 ? `<div class="cluster-divider"><div style="flex:1;height:1px;background:${col}20"></div><div style="font-size:11px;color:var(--dim);font-weight:700;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap;padding:0 10px">then →</div><div style="flex:1;height:1px;background:${(data.clusters[ci+1]?.color)||'#7c6aff'}20"></div></div>` : ''}
    `;
    grid.appendChild(sec);

    const sg = document.getElementById(`sg-${ci}`);
    skills.forEach((skill, si) => {
      const lvl = skill.level || 'foundation';
      const lc  = lvl==='foundation' ? '#5f5e5a' : lvl==='intermediate' ? col : '#22d3a0';
      const lb  = lvl==='foundation' ? 'rgba(95,94,90,.1)' : lvl==='intermediate' ? col+'18' : 'rgba(34,211,160,.1)';
      const op  = lvl==='foundation' ? '.05' : lvl==='intermediate' ? '.09' : '.13';

      const card = document.createElement('div');
      card.className = 'skill-card';
      card.style.cssText = `border-left:3px solid ${col};`;
      card.innerHTML = `
        <div style="position:absolute;inset:0;background:${col};opacity:${op};pointer-events:none"></div>
        <div class="skill-num">
          <div class="skill-num-badge" style="background:${col}20;border:1px solid ${col}50;color:${col}">${si+1}</div>
          <div class="skill-name">${skill.name}</div>
        </div>
        <div class="skill-desc">${skill.desc||''}</div>
        <div class="skill-lvl" style="background:${lb}">
          <div style="width:5px;height:5px;border-radius:50%;background:${lc};flex-shrink:0"></div>
          <span style="color:${lc}">${lvl}</span>
        </div>`;
      card.addEventListener('mouseenter', ()=>{ card.style.background=col+'12'; });
      card.addEventListener('mouseleave', ()=>{ card.style.background=''; });
      sg.appendChild(card);
    });
  });
}

export { renderSkeleton, renderRoadmap };
