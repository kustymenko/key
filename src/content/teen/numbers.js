// Тексти з цифрами й символами для 5–6 класів (Етап Т5): числа, дати, ціни, одиниці, приклади. Лише дані, лише власні тексти.
// Без реальних телефонів, адрес, імен і посилань. Кожен запис отримує marks / needs автоматично (util.js).
// Банк окремий від TEEN_TEXTS: в старих банках цифр немає за правилом Етапу Т4. Генератор — src/teen/logic/numbers.js.
import { S } from './util.js';

// ---------- УКРАЇНСЬКА ----------
// Лише цифри 1–5 (для уроку «цифри, ліва рука»)
const UA_LEFT = S('цифри', `
  У нашому класі 25 учнів, і всі вони люблять математику.
  Перерва триває 15 хвилин, тому ми встигаємо відпочити.
  На столі лежать 3 олівці, 4 ручки і 2 лінійки.
  До школи від мого дому 450 метрів, це близько 5 хвилин.
  У теплицю ми посадили 24 помідори і 12 огірків.
  Мій брат старший за мене на 4 роки.
  На полиці стоїть 31 книжка, а на столі лежить ще 5.
  Влітку ми проїхали 245 кілометрів на велосипедах.
  Футбольна команда має 11 гравців, а в запасі ще 3.
  Цей ліфт піднімає не більше 4 людей за раз.
  Квиток коштує 25 гривень, а проїзд - 15 гривень.
  У нашому дворі росте 12 берез і 5 каштанів.
  Скільки буде, якщо до 14 додати 21?
  Експедиція тривала 14 днів, а до табору йшли ще 2 дні.
  На карті позначено 5 річок, 3 озера і 24 містечка.
  У коробці було 35 олівців, а залишилось лише 12.
  Другого дня ми пройшли 13 кілометрів, а третього - 21.
  Автобус їде повз нашу школу кожні 12 хвилин.
  Ми з друзями назбирали 43 каштани і 25 жолудів.
`);
// Будь-які цифри (після уроку «цифри, права рука»)
const UA_ANY = S('числа', `
  Школа відчиняється о 8:00, а перший урок починається о 8:30.
  У бабусі в саду росте 17 яблунь на ділянці в 600 квадратних метрів.
  Висота нашої гори - 1850 метрів над рівнем моря.
  Потяг вирушає о 17:45 і прибуває о 21:10.
  У музеї 9 залів, і в кожному понад 70 експонатів.
  Табір починається 15.06.2027 і закінчується 28.06.2027.
  Концерт відбудеться 7 жовтня о 18:00 у шкільному залі.
  Сьогодні 6 градусів тепла, а вчора було 10.
  Наш клас зібрав 96 пляшок для переробки, а паралельний - 80.
  Рік має 365 днів, а високосний - 366.
  Тиждень складається із 7 днів, а доба - із 24 годин.
  У хвилині 60 секунд, а в годині - 60 хвилин.
  Мій рюкзак важить 8 кілограмів, і це забагато.
  Тренування починається о 16:30 і триває 90 хвилин.
  Ми розв'язали 10 задач за 20 хвилин і перевірили відповіді.
  У змаганні взяли участь 128 школярів із 9 шкіл.
  Квиток у кіно коштує 90 гривень, а попкорн - 60.
  Температура води в озері була 19 градусів, тож купатися було прохолодно.
  Площа спортивного майданчика - 400 квадратних метрів.
  У бібліотеці понад 3000 книжок і 12 читацьких місць.
  Звук у повітрі за секунду долає близько 340 метрів.
  Рахуємо до 100 і назад: 100, 99, 98 і так до одиниці!
  Робот проїхав 70 сантиметрів, повернув праворуч і проїхав ще 90.
  Наше місто старше за 600 років, а школа - за 100.
  Урок математики в п'ятницю починається о 10:05.
  Ми записали результат: 7 хвилин 40 секунд.
`);
// Символи: № % *
const UA_SIGNS = S('символи', `
  Квиток № 5 дає право зайти до читального залу.
  Мій клас займається в кабінеті № 14 на другому поверсі.
  У списку під № 7 стоїть найцікавіша задача.
  Автобус № 22 зупиняється біля школи.
  Запиши відповідь у зошиті під № 3 і підкресли її.
  Шафа № 12 у роздягальні належить нашому класу.
  Гурток відбувається в залі № 2 щовівторка.
  Завдання № 9 було найскладніше, але ми його розв'язали.
  Конверт № 4 містить ключ до наступної загадки.
  Команда № 6 прийшла до фінішу першою.
  Лише 25% учнів нашого класу ходять до школи пішки.
  Заряд батареї впав до 40%, тож час шукати зарядку.
  Знижка в магазині канцтоварів - 15%, і ми купили зошити.
  Із 20 учнів 10 обрали шахи, це рівно 50%.
  У контрольній я виконав 90% завдань без жодної помилки.
  Вологість повітря сьогодні 65%, тому відчувається тепліше.
  Точність мого друку зросла з 80% до 95%.
  Яблуко складається приблизно на 85% з води.
  Ми пройшли 30% маршруту й вирішили відпочити.
  Заряд ноутбука 100%, тож можна друкувати довго.
  Слово із зірочкою * потребує пояснення внизу сторінки.
  Зірочка * в таблиці означає, що результат ще перевіряють.
  У прикладі 6 * 7 зірочка замінює знак множення.
  Побачиш * поруч з назвою - шукай примітку внизу.
  Помнож 12 * 3 і порівняй зі своєю відповіддю.
  Результат 9 * 5 дорівнює сорока п'яти.
  Задача * вважається складнішою, і за неї дають більше балів.
  Три зірочки *** позначають найкращу відповідь у таблиці.
  Зірочка * часто означає, що поруч є примітка.
`);
// Дії: + і =
const UA_MATH = S('приклади', `
  Перевір запис: 15 + 27 = 42, і відповідь правильна.
  Якщо 8 + 5 = 13, то 13 - 5 = 8.
  Рівність 9 * 6 = 54 допоможе перевірити результат.
  Знак = означає, що обидві частини мають однакове значення.
  Знак + додає числа, а знак - віднімає.
  Запиши розв'язок: 36 + 24 = 60, тож усього 60 яблук.
  У рівності ? + 5 = 12 пропущено число 7.
  Два доданки 40 + 25 дають суму 65.
  Правильний запис: 100 - 36 = 64.
  Перевір рівність 7 + 7 = 14 і запиши її в зошит.
  Спершу 20 + 30 = 50, а потім 50 + 5 = 55.
  Сума 18 + 22 = 40 рівно дорівнює половині від 80.
  Ми порахували: 12 * 4 = 48, і це збігається з відповіддю.
  Запис 3 + 3 + 3 = 9 можна замінити на 3 * 3 = 9.
`);

// ---------- ENGLISH ----------
const EN_LEFT = S('digits', `
  There are 25 students in our class, and 12 of them play chess.
  The bus runs every 15 minutes between the school and the park.
  I have 3 pencils, 4 pens and 2 rulers in my bag.
  The library is 450 metres from my house.
  We planted 24 tomatoes and 12 cucumbers in the school garden.
  My brother is 4 years older than me.
  The shelf holds 31 books, and 5 more are on the table.
  Last summer we cycled 245 kilometres along the river.
  A football team has 11 players on the field.
  The lift can carry no more than 4 people at a time.
  A ticket costs 25 coins, and a snack costs 15.
  The trip lasted 14 days, and we walked 13 kilometres on day two.
  The map shows 5 rivers, 3 lakes and 24 villages.
  The box held 35 crayons, but only 12 are left.
  We collected 43 chestnuts and 25 acorns in the park.
  Break lasts 15 minutes, so we have time for a short rest.
`);
const EN_ANY = S('numbers', `
  School opens at 8:00, and the first lesson starts at 8:30.
  The garden is 600 square metres, and 17 apple trees grow there.
  The train leaves at 17:45 and arrives at 21:10.
  The museum has 9 halls with over 70 objects in each.
  The camp starts on 15.06.2027 and ends on 28.06.2027.
  The concert is on 7 October at 18:00 in the school hall.
  It is 6 degrees outside today, but yesterday it was 10.
  Our class collected 96 bottles, and the other class collected 80.
  A year has 365 days, and a leap year has 366.
  A week has 7 days, and a day has 24 hours.
  A minute has 60 seconds, and an hour has 60 minutes.
  My backpack weighs 8 kilograms, which is far too heavy.
  Practice starts at 16:30 and lasts 90 minutes.
  We solved 10 problems in 20 minutes and checked every answer.
  The robot moved 70 centimetres, turned right and moved 90 more.
  The football pitch measures 400 square metres.
  Sound travels about 340 metres in one second.
  The race lasted 7 minutes and 40 seconds.
  Our town is over 600 years old, and the school is 100.
  Maths class on Friday starts at 10:05.
`);
const EN_SIGNS = S('symbols', `
  Room #14 is on the second floor, next to the library.
  Bus #22 stops right in front of our school.
  Write your answer next to task #3 and underline it.
  Locker #12 belongs to our class.
  Team #6 reached the finish line first.
  Task #9 was the hardest, but we solved it.
  Envelope #4 contains the key to the next riddle.
  The club meets in hall #2 on Tuesdays.
  Seat #5 is by the window, and seat #6 is next to it.
  Page #30 shows the map of the whole park.
  Table #3 is ready for the quiz.
  The notebook costs $4, and the pen costs $2.
  A ticket for the show costs $15 for each student.
  We saved $120 for the class trip by selling crafts.
  The old bicycle was sold for $85 last weekend.
  A bottle of juice costs $3, and a sandwich costs $5.
  The school raised $250 at the spring fair.
  Each ticket was $7, so four tickets cost $28.
  Only 25% of the students in our class walk to school.
  The battery fell to 40%, so it was time to find a charger.
  The shop gives a 15% discount on notebooks this week.
  Ten of our twenty students chose chess, which is exactly 50%.
  I solved 90% of the problems without a single mistake.
  My typing accuracy grew from 80% to 95% in one month.
  We have finished 30% of the route and decided to rest.
  The laptop is charged to 100%, so we can type for a long time.
  About 60% of our class chose tea, and the rest chose juice.
  The test was 20% shorter than usual, so we finished early.
  Tom & Ann built a small robot from old boxes.
  The shop sells salt & pepper in tiny glass jars.
  Our club "Art & Science" meets every Friday.
  Bread & butter is my favourite quick snack.
  Mark & Eva won the quiz by one point.
  Cats & dogs both lived in the old farmhouse.
  Pens & pencils are on the second shelf of the cupboard.
  The new cafe sells fruit & nuts in small paper bags.
  Lena & Oleh prepared a short talk about volcanoes.
  Rules & answers are printed on the last page of the booklet.
  Tickets are 3 @ $4, so the total is $12.
  Pens cost 5 @ $2 each in the school shop.
  Buy 4 @ $3 and pay $12 in total.
  We sold 6 @ $5, which made $30 for the class fund.
  Apples are 8 @ $1 today, so eight apples cost $8.
  Pencils were 10 @ $1, so we paid $10 for the set.
  Stickers are 3 @ $2, so three stickers cost $6.
  Bananas were 7 @ $1 at the market today.
  Maps cost 2 @ $5, so the pair costs $10.
  Cards were 9 @ $2 in the shop by the bridge.
  A star * next to a word means there is a note below.
  The table marks unfinished results with a star *.
  In this example, 6 * 7 means six times seven.
  Multiply 12 * 3 and compare it with your answer.
  The result of 9 * 5 is forty-five.
  A task marked * is harder and gives extra points.
  Three stars *** mean the best answer in the table.
`);
const EN_MATH = S('examples', `
  Check the sum: 15 + 27 = 42, and the answer is correct.
  If 8 + 5 = 13, then 13 - 5 = 8.
  The equation 9 * 6 = 54 helps to check the result.
  The sign = means both sides have the same value.
  The sign + adds numbers, and the sign - subtracts them.
  Write the solution: 36 + 24 = 60, so there are 60 apples.
  Two numbers 40 + 25 give the sum 65.
  The correct record is 100 - 36 = 64.
  Check the equation 7 + 7 = 14 and write it down.
  First 20 + 30 = 50, and then 50 + 5 = 55.
  The sum 18 + 22 = 40 is exactly half of 80.
  We counted 12 * 4 = 48, and it matches the answer.
  The record 3 + 3 + 3 = 9 can be replaced by 3 * 3 = 9.
  Our answer is 14 + 26 = 40, and the teacher agrees.
  Add the numbers: 11 + 12 = 23, and write the sum below.
  The puzzle says that 5 + 5 = 10, so each part is half of 10.
`);

export const TEEN_NUMBERS = {
  ua: { left: UA_LEFT, any: UA_ANY, signs: UA_SIGNS, math: UA_MATH, all: [...UA_LEFT, ...UA_ANY, ...UA_SIGNS, ...UA_MATH] },
  en: { left: EN_LEFT, any: EN_ANY, signs: EN_SIGNS, math: EN_MATH, all: [...EN_LEFT, ...EN_ANY, ...EN_SIGNS, ...EN_MATH] },
};
