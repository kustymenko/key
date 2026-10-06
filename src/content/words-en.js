// Банк англійських слів, рівень A1 (лише дані). '1-2' — 2–4 літери, '3-4' — 4–8 літер.
// Без апострофів. Перевіряє tests/content.test.js.
import { T, uniq } from './util.js';

export const WORDS_EN = uniq([
  // ---------- 1–2 клас: слова з 2–4 літер ----------
  ...T('1-2', 'animals', `cat dog pig cow hen fox bee ant owl rat bat cub elk yak ape emu eel cod ram ewe doe fly bug pup kid hog
    lion bear duck frog fish bird wolf deer goat seal crab swan mole mice lamb toad worm moth hare`),
  ...T('1-2', 'food', `egg jam pie tea ham bun nut oat rye fig pea yam milk rice cake corn bean soup meat lime plum pear peas`),
  ...T('1-2', 'nature', `sun sky sea mud ice fog dew hay leaf tree rain snow wind moon star rock sand wave hill lake pond nest cave`),
  ...T('1-2', 'colors', `red tan blue pink gold gray`),
  ...T('1-2', 'body', `arm leg toe eye ear lip hip rib chin hand foot nose face back knee hair neck`),
  ...T('1-2', 'home', `bed cup mug pan pot box key lid fan rug tub mat door roof wall desk lamp sofa bath bowl fork`),
  ...T('1-2', 'clothes', `hat cap bag coat shoe sock belt vest boot`),
  ...T('1-2', 'school', `pen map book glue test song game play word read draw`),
  ...T('1-2', 'family', `mom dad boy man sis son baby aunt girl kids`),
  ...T('1-2', 'verbs', `run sit eat sip hop jog hug sing jump walk talk help swim look like love give take make find tell come see say ask get put buy cut dig`),
  ...T('1-2', 'small words', `am is it in on at up me my we he be do no so to us an as or by if the and you she him her his one two six ten`),
  ...T('1-2', 'adjectives', `big sad hot wet new old low fat shy kind nice cold warm soft hard slow fast tall tiny good best long fun`),
  // ---------- 3–4 клас: слова з 4–8 літер ----------
  ...T('3-4', 'animals', `rabbit turtle monkey donkey horse sheep tiger zebra panda koala snake spider beetle parrot rooster puppy kitten
    dolphin whale shark lizard hamster giraffe penguin pigeon camel mouse bunny`),
  ...T('3-4', 'food', `apple banana orange cherry lemon grape melon peach carrot potato tomato cookie cheese butter bread cream candy sugar
    honey juice salad pasta pizza noodle muffin waffle pancake pudding`),
  ...T('3-4', 'nature', `forest river ocean island garden flower meadow rainbow thunder cloud winter spring summer autumn sunny cloudy
    breeze beach desert valley mountain`),
  ...T('3-4', 'school', `school teacher pencil eraser ruler marker paper notebook letter number reading writing drawing music lesson
     library`),
  ...T('3-4', 'home', `house window kitchen bedroom table chair carpet pillow blanket mirror clock basket bucket`),
  ...T('3-4', 'body and clothes', `finger shoulder elbow pocket jacket sweater mitten scarf sandal`),
  ...T('3-4', 'play', `soccer tennis football balloon puzzle castle robot rocket train plane bicycle kite swing slide skate`),
  ...T('3-4', 'words', `happy friend family bright clever gentle kindly quiet speedy giant little yellow purple brown silver golden`),
  ...T('3-4', 'verbs', `jumping running singing dancing painting sleeping smiling laughing helping walking playing`),
  ...T('3-4', 'people', `mother father sister brother grandma grandpa cousin friend doctor driver farmer baker painter singer`),
  ...T('3-4', 'time', `morning evening night today tomorrow weekend holiday birthday season minute second`),
  ...T('3-4', 'things', `picture present basket ticket button rocket bottle camera guitar window pocket candle trumpet`),
  ...T('3-4', 'more', `hello thanks please sorry welcome   favorite surprise `),
  ...T('3-4', 'more animals', `elephant chicken ladybug   squirrel hedgehog kangaroo  goldfish`),
  ...T('3-4', 'more food', `sandwich   pumpkin cucumber broccoli yogurt  lollipop popcorn`),
  ...T('3-4', 'more nature', `sunshine  raindrop seashell pebble blossom branch feather sunrise sunset `),
]);
