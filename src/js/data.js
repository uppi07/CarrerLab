import { supabase } from './config.js';
import { A } from './state.js';
import { go } from './utils.js';
import { buildSidebar, selectDay } from './schedule.js';

export async function loadUserData() {
  try {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', A.userId).maybeSingle();
    if (profile) {
      A.name = profile.name;
      A.role = profile.role;
      A.days = profile.days || 30;
      document.getElementById('user-chip').textContent = A.name;
      document.getElementById('user-name').value = A.name;
      document.getElementById('target-role').value = A.role;
      document.getElementById('timeframe').value = A.days;
    }

    const { data: schedule } = await supabase.from('schedules').select('*').eq('user_id', A.userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (schedule) {
      A.scheduleId = schedule.id;
      A.plan = schedule.plan_json || [];
      const { data: progress } = await supabase.from('progress').select('*').eq('user_id', A.userId);
      if (progress) progress.forEach(p => { if (p.completed) A.done.add(p.day_number - 1); });
      const { data: lessons } = await supabase.from('lessons').select('*').eq('user_id', A.userId);
      if (lessons) lessons.forEach(l => { A.lessons[l.day_number - 1] = { content: l.content, quiz: l.quiz_json || [] }; });

      const { data: roadmap } = await supabase.from('roadmaps').select('*').eq('id', schedule.roadmap_id).maybeSingle();
      if (roadmap) {
        A.mmData = roadmap.roadmap_json;
        A.jd = roadmap.jd_text;
        A.role = roadmap.role;
        A.roadmapId = roadmap.id;
        buildSidebar();
        go('s3');
        selectDay(0);
      }
    } else {
      go('s1');
    }
  } catch (e) {
    console.error('Load user data error:', e);
    go('s1');
  }
}
