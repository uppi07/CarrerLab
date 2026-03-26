import { supabase } from './config.js';
import { A } from './state.js';
import { go, toast, sleep } from './utils.js';
import { loadUserData } from './data.js';

export async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-pwd').value.trim();
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-err');
  errEl.style.display = 'none';

  if (!email || !password) {
    errEl.textContent = 'Enter email and password';
    errEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Signing in…';

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    A.user = data.user;
    A.userId = data.user.id;
    await loadUserData();
    toast('Signed in!', 'ok');
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign in';
  }
}

export async function handleRegister() {
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-pwd').value.trim();
  const btn = document.getElementById('register-btn');
  const errEl = document.getElementById('register-err');
  errEl.style.display = 'none';

  if (!name || !email || !password) {
    errEl.textContent = 'All fields required';
    errEl.style.display = 'block';
    return;
  }
  if (password.length < 8) {
    errEl.textContent = 'Password must be at least 8 characters';
    errEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Creating account…';

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (!data.user) {
      throw new Error('Signup failed - no user returned');
    }

    A.user = data.user;
    A.userId = data.user.id;
    A.name = name;

    await sleep(500);

    const { error: profileError } = await supabase.from('profiles').insert({
      id: A.userId,
      name: name,
      role: '',
      level: '',
      days: 30
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw new Error('Failed to create profile: ' + profileError.message);
    }

    document.getElementById('user-chip').textContent = name;
    document.getElementById('user-name').value = name;

    toast('Account created!', 'ok');

    document.getElementById('register-name').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-pwd').value = '';

    go('s1');
  } catch (e) {
    console.error('Registration error:', e);
    errEl.textContent = e.message || 'Registration failed';
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Create account';
  }
}

export async function handleLogout() {
  await supabase.auth.signOut();
  A.user = null;
  A.userId = null;
  A.api = '';
  A.name = '';
  A.role = '';
  A.jd = '';
  A.mmData = null;
  A.plan = [];
  A.done.clear();
  A.lessons = {};
  A.lessonStep = {};
  document.getElementById('login-email').value = '';
  document.getElementById('login-pwd').value = '';
  document.getElementById('register-name').value = '';
  document.getElementById('register-email').value = '';
  document.getElementById('register-pwd').value = '';
  go('s0');
  toast('Signed out', 'ok');
}

export async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    A.user = session.user;
    A.userId = session.user.id;
    await loadUserData();
  } else {
    go('s0');
  }
}

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT') {
    A.user = null;
    A.userId = null;
  } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    if (session) {
      A.user = session.user;
      A.userId = session.user.id;
    }
  }
});
