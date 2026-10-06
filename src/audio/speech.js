// Озвучка через Web Speech API (проста версія; повна — Етап 5). Нічого не ламається, якщо голосу немає.
let enabled = true;
let voices = [];

function refresh() {
  try { voices = window.speechSynthesis?.getVoices() ?? []; } catch { voices = []; }
}
try {
  refresh();
  window.speechSynthesis?.addEventListener?.('voiceschanged', refresh); // голоси завантажуються не одразу
} catch { /* озвучки немає */ }

export const setSpeechEnabled = (on) => { enabled = on; if (!on) stopSpeech(); };

export function hasVoice(lang = 'uk-UA') {
  return voices.some((v) => v.lang?.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
}

// Нова фраза скасовує попередню
export function speak(text, lang = 'uk-UA') {
  if (!enabled || !text) return false;
  try {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return false;
    const voice = voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang?.toLowerCase().startsWith(lang.slice(0, 2)));
    if (!voice) return false;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.voice = voice;
    u.rate = 0.9;
    synth.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeech() {
  try { window.speechSynthesis?.cancel(); } catch { /* нічого */ }
}
