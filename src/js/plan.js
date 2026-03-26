import { supabase } from './config.js';
import { A } from './state.js';
import { go, toast, ai, parseArr, sleep } from './utils.js';
import { buildSidebar, selectDay } from './schedule.js';

export async function confirmRoadmap() {
  const btn = document.getElementById('s2-confirm-btn');
  btn.disabled = true;
  btn.textContent = 'Building schedule…';

  try {
    if (!A.roadmapId) {
      toast('Roadmap not found', 'err');
      btn.disabled = false;
      btn.textContent = 'Looks good — build my schedule →';
      return;
    }

    if (A.scheduleId) {
      const confirmed = confirm('You already have a schedule. This will replace your existing progress. Continue?');
      if (!confirmed) {
        btn.disabled = false;
        btn.textContent = 'Looks good — build my schedule →';
        return;
      }
    }

    await generatePlan();

    A.done = new Set();
    A.currentDay = null;
    A.lessons = {};
    A.lessonStep = {};

    const { data: scheduleData, error: scheduleError } = await supabase.from('schedules').upsert({
      user_id: A.userId,
      roadmap_id: A.roadmapId,
      plan_json: A.plan,
      done: [],
      current_day: null,
      lessons: {},
      lesson_step: {},
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' }).select().maybeSingle();

    if (scheduleError) throw scheduleError;
    A.scheduleId = scheduleData.id;

    buildSidebar();
    go('s3');
    toast('Schedule ready!', 'ok');
    selectDay(0);
  } catch(e) {
    toast('Schedule failed: ' + e.message, 'err');
  }

  btn.disabled = false;
  btn.textContent = 'Looks good — build my schedule →';
}

async function generatePlan(attempt=1) {
  const sys = `Career coach. Return only a JSON array. First char [ last char ].`;
  const msg = `${A.days}-day learning plan for "${A.role}".
JD: ${A.jd.substring(0,600)}
Return array of ${A.days} objects:
[{"day":1,"topic":"Topic 4 words","task":"One actionable sentence.","objectives":["obj1","obj2","obj3"]}]
- topic: 2-4 words no punctuation
- task: 1-2 sentences
- objectives: exactly 3 strings
- Start with [`;

  try {
    const raw = await ai([{role:'user',content:msg}], sys, 4096);
    A.plan = parseArr(raw).map((d,i)=>({
      day: typeof d.day==='number' ? d.day : i+1,
      topic: String(d.topic||'Day '+(i+1)),
      task: String(d.task||''),
      objectives: Array.isArray(d.objectives) ? d.objectives.flat().map(String).slice(0,3) : ['Complete','Review','Apply']
    }));
    if (!A.plan.length) throw new Error('Empty plan');
  } catch(e) {
    if (attempt<3) { await sleep(1500*attempt); return generatePlan(attempt+1); }
    throw e;
  }
}
