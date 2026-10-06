import { BADGES } from '../content/badges.js';
import { COURSE } from '../lessons/course.js';

// Скільки зірочок і пройдених уроків у профілі
export const totalStars = (profile) =>
  Object.values(profile.progress).reduce((s, byId) => s + Object.values(byId).reduce((a, n) => a + n, 0), 0);
export const lessonsDone = (profile) => Object.values(profile.progress).reduce((s, byId) => s + Object.keys(byId).length, 0);

const doneIn = (profile, layout, ids) => ids.every((id) => profile.progress[layout]?.[id]);
// Усі уроки з новими літерами курсу (без Shift і розділових знаків 20–21 / 17–18)
const letterLessons = (layout) => COURSE[layout].filter((l) => l.kind === 'letters' || l.kind === 'review').map((l) => l.id);

// Правила: значок отримано, якщо правило істинне
const RULES = {
  first: (p) => lessonsDone(p) >= 1,
  three: (p) => Object.values(p.progress).some((byId) => Object.values(byId).some((n) => n >= 3)),
  'home-row': (p) => ['ua', 'en'].some((l) => doneIn(p, l, [1, 2, 3, 4, 5])),
  clean: (p) => !!p.flags?.clean,
  'stars-10': (p) => totalStars(p) >= 10,
  'lessons-10': (p) => lessonsDone(p) >= 10,
  'two-courses': (p) => Object.keys(p.progress.ua ?? {}).length > 0 && Object.keys(p.progress.en ?? {}).length > 0,
  alphabet: (p) => ['ua', 'en'].some((l) => doneIn(p, l, letterLessons(l))),
};

// Нові значки після зміни профілю: повертає id тих, що щойно отримано (і записує їх у profile.badges)
export function awardBadges(profile, now = Date.now()) {
  const fresh = [];
  for (const b of BADGES) {
    if (profile.badges[b.id] || !RULES[b.id](profile)) continue;
    profile.badges[b.id] = now;
    fresh.push(b.id);
  }
  return fresh;
}
