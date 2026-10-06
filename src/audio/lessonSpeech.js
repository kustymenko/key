import { keyNameNom, isPunct } from '../lessons/course.js';
import { UA_LETTER_NAMES, EN_LETTER_NAMES } from '../content/spoken.js';

// Те саме, що lessonTitle, але літери — назвами: «Урок 2. Літери ве і ел»
export function spokenTitle(layout, lesson) {
  const names = layout === 'ua' ? UA_LETTER_NAMES : EN_LETTER_NAMES;
  const head = `Урок ${lesson.id}. `;
  if (lesson.title) return head + lesson.title;
  const letters = lesson.letters.filter((c) => !isPunct(c)).map((c) => names[c] ?? c);
  const marks = lesson.letters.filter(isPunct).map(keyNameNom);
  const parts = [];
  if (letters.length) parts.push(`${letters.length > 1 ? 'літери' : 'літера'} ${letters.join(' і ')}`);
  if (marks.length) parts.push(marks.join(' і '));
  return head + parts.join(' і ');
}
