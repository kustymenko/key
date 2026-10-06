// Налаштування звуку.
// Озвучка фраз (Web Speech API) увімкнена. На деяких комп'ютерах голос синтезатора поганий
// (наприклад, Firefox в Ubuntu) — для них у ROADMAP.md описана «Версія 2» із записами голосу вчителя.
// PHRASE_SPEECH = false вимикає голос і ховає всі кнопки-динаміки одним рядком.
export const PHRASE_SPEECH = true;

// Звукові ефекти (Web Audio): ключ у localStorage окремо від профілів — перемикач спільний для ноутбука
export const SFX_KEY = 'klaviaturka.sfx.v1';
