// Банки текстів 5–6 класів: один вхід для логіки та тестів. Лише власні тексти (див. ukrainian-content, «5–6 класи»).
import { SENTENCES_T_UA, PHRASES_UA } from './ua-sentences.js';
import { PARAGRAPHS_UA } from './ua-paragraphs.js';
import { APOS_WORDS_UA, APOS_SENTENCES_UA, GU_WORDS_UA, GU_SENTENCES_UA } from './ua-special.js';
import { SENTENCES_T_EN, PHRASES_EN, PARAGRAPHS_EN } from './en.js';

export const TEEN_TEXTS = {
  ua: { phrases: PHRASES_UA, sentences: SENTENCES_T_UA, paragraphs: PARAGRAPHS_UA, aposWords: APOS_WORDS_UA, aposSentences: APOS_SENTENCES_UA, guWords: GU_WORDS_UA, guSentences: GU_SENTENCES_UA },
  en: { phrases: PHRASES_EN, sentences: SENTENCES_T_EN, paragraphs: PARAGRAPHS_EN, aposWords: [], aposSentences: [], guWords: [], guSentences: [] },
};
