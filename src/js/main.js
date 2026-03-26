import { handleLogin, handleRegister, handleLogout, initAuth } from './auth.js';
import { buildRoadmap } from './roadmap.js';
import { confirmRoadmap } from './plan.js';
import { switchStep, toggleChk, answerQ, markDone, loadLesson } from './schedule.js';
import { sendMsg, handleKey, autoResize, goToChat } from './chat.js';
import { go } from './utils.js';

window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.buildRoadmap = buildRoadmap;
window.confirmRoadmap = confirmRoadmap;
window.switchStep = switchStep;
window.toggleChk = toggleChk;
window.answerQ = answerQ;
window.markDone = markDone;
window.loadLesson = loadLesson;
window.sendMsg = sendMsg;
window.handleKey = handleKey;
window.autoResize = autoResize;
window.goToChat = goToChat;
window.go = go;

window.addEventListener('DOMContentLoaded', initAuth);
