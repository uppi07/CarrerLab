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
      A.done = new Set((schedule.done || []).map(d => parseInt(d)));
      A.currentDay = schedule.current_day !== null ? schedule.current_day : null;
      A.lessons = schedule.lessons || {};
      A.lessonStep = schedule.lesson_step || {};

      const { data: roadmap } = await supabase.from('roadmaps').select('*').eq('id', schedule.roadmap_id).maybeSingle();
      if (roadmap) {
        A.mmData = roadmap.roadmap_json;
        A.jd = roadmap.jd_text;
        A.role = roadmap.role;
        A.days = roadmap.days || 30;
        A.roadmapId = roadmap.id;
        buildSidebar();
        go('s3');
        selectDay(A.currentDay !== null ? A.currentDay : 0);
      }
    } else {
      go('s1');
    }
  } catch (e) {
    console.error('Load user data error:', e);
    go('s1');
  }
}

export async function saveRoadmap(mmData) {
  const { data, error } = await supabase.from('roadmaps').insert({
    user_id: A.userId,
    role: A.role,
    jd_text: A.jd,
    days: A.days,
    roadmap_json: mmData
  }).select().single();

  if (error) throw error;
  A.roadmapId = data.id;
  return data.id;
}

export async function saveSchedule(plan) {
  const { data, error } = await supabase.from('schedules').insert({
    user_id: A.userId,
    roadmap_id: A.roadmapId,
    plan_json: plan,
    done: Array.from(A.done),
    current_day: A.currentDay,
    lessons: A.lessons,
    lesson_step: A.lessonStep
  }).select().single();

  if (error) throw error;
  A.scheduleId = data.id;
  return data.id;
}

export async function updateScheduleProgress() {
  if (!A.scheduleId) return;

  await supabase.from('schedules').update({
    done: Array.from(A.done),
    current_day: A.currentDay,
    lessons: A.lessons,
    lesson_step: A.lessonStep,
    updated_at: new Date().toISOString()
  }).eq('id', A.scheduleId);
}
