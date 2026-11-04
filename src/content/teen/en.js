// English texts for grades 5–6 (A2): sentences, short phrases, paragraphs. Data only, all original.
// No digits and no Cyrillic. Apostrophes (it's, don't) appear only in lessons that follow the apostrophe lesson.
import { S, P } from './util.js';

export const SENTENCES_T_EN = [
  ...S('plain', `
    The train leaves the station at a quarter past seven every morning.
    Our school library has a quiet corner with soft chairs and a large window.
    Tom and his sister built a small robot from old boxes and wheels.
    A cold wind came down from the mountains and shook the old wooden gate.
    Every evening the fisherman walks along the beach and watches the waves.
    The new bridge connects two parts of the city and saves a lot of time.
    Bees visit hundreds of flowers every day and carry pollen between them.
    The museum opens early in the morning and closes late in the afternoon.
    A small green frog jumped from the leaf into the pond without a sound.
    Our teacher showed us how to read a simple map of the town.
    Clouds gathered over the hills and the first drops of rain began to fall.
    The astronaut waved to the camera and floated slowly across the cabin.
    My cousin plays the violin and practises for an hour every day.
    The bakery on our street sells fresh bread and warm cinnamon rolls.
    Last summer we cycled along the river and slept in a small tent.
    The little boat moved slowly across the lake and left a long silver line.
  `),
  ...S('commas', `
    When the sun goes down, the lights of the town slowly turn on.
    We packed bread, cheese, apples and a bottle of water for the trip.
    Although it was cold, the children played outside until it got dark.
    In spring, the garden is full of birds, bees and bright flowers.
    If you listen carefully, you can hear the river behind the trees.
    My brother likes football, but I prefer swimming and cycling.
    After lunch, we walked to the park, fed the ducks and sat by the lake.
    Maria opened the window, looked at the sky and smiled.
    Because the road was closed, the bus took a longer way around the town.
    The scientist checked the numbers twice, wrote the result and closed the notebook.
    Before the game, the coach explained the plan, and everyone listened.
    Slowly and carefully, the climber moved up the last steep part of the rock.
    The cook mixed flour, eggs and milk, and soon there was a pile of pancakes.
    In the evening, the street was quiet, the shops were closed and the air was cool.
  `),
  ...S('apostrophe', `
    I don't know the answer, but I'm going to find it.
    It's a sunny day, so we're going to the lake.
    She can't come today because she's helping her grandmother.
    They're building a tree house, and it's almost ready.
    Let's meet at the station before the train leaves.
    My dog doesn't like rain, but he loves puddles.
    We didn't see the film, because the tickets were sold out.
    I'll call you when I'm at home, so don't worry.
    He isn't tired yet, so he's still reading in bed.
    That's the book I've been looking for all week.
    You're right, we haven't checked the last page.
    The teacher's notebook was open on the desk next to Tom's bag.
    The children's playground is behind the library and the old school.
    Don't forget your umbrella, because it's raining outside.
  `),
  ...S('questions', `
    Where does this path lead, and how long will it take?
    Do you want tea or juice with your breakfast?
    Who left the window open in the science room?
    How many planets can you name without looking at a book?
    Can you help me find the missing key?
    Why is the sky blue during the day and red in the evening?
    Which bus goes to the museum from here?
    Is it possible to travel faster than sound?
    What time does the school concert start tonight?
    Have you ever seen a rainbow at night?
    What's that sound? I think it's the wind.
  `),
  ...S('exclamations', `
    Look at the moon, it is so bright tonight!
    We won the match, and the whole team is cheering!
    What a beautiful view from the top of the hill!
    Be careful, the floor in the hall is still wet!
    Hurry up, the train is about to leave!
    Great job, you finished the whole puzzle yourself!
    Wow, the experiment worked on the first try!
    Stop, there is a bike coming from the left!
    Listen, the birds are singing in the garden already!
    Well done, our little robot found the way out of the maze!
    Come quickly, the rainbow is just above the school roof!
    Hooray, the sun is out and we can finally go outside!
  `),
  ...S('semicolons', `
    Some birds fly south in autumn; others stay here all year.
    My brother plays football; my sister prefers swimming.
    The morning was cold; the afternoon was warm and sunny.
    First we read the text; then we answer the questions.
    Anna likes tea with lemon; Peter likes it with honey.
    The shop opens early; it closes late in the evening.
    Some stars are red; others look white or blue.
    The river is wide here; farther up it becomes narrow.
    I finished the book; now I want to read the next one.
    The first group measured the water; the second group counted the fish.
    One road leads to the lake; the other goes up the hill.
  `),
  ...S('colons', `
    You need three things for the project: paper, glue and scissors.
    Remember the rule: always check your work before you finish.
    The menu has two choices: soup or salad.
    Here is my plan: first we read, then we write, and then we talk.
    Please bring these items: a notebook, a pencil and a bottle of water.
    There is only one problem: the battery is empty.
    The weather forecast says: sunny in the morning, rainy in the evening.
    My day is simple: school, homework, a walk and a good book.
  `),
  ...S('brackets', `
    Our class (all twenty students) visited the science museum last week.
    The old castle (it stands on a hill) attracts many visitors every summer.
    Please add some fruit (apples or bananas) to the salad.
    She reads a lot (mostly adventure stories) and writes her own notes.
    The robot (it was built by students) can move across the whole room.
    The match (it lasted two hours) ended with a draw.
    He finally found his glasses (they were on the shelf) and went back to work.
    My grandmother has a garden (full of roses) behind her house.
    The new library (it opens next month) will have a large reading room.
    We saw a rare bird (a blue kingfisher) near the old bridge.
    Our neighbour (a kind old man) always waters the flowers in the yard.
    The test (it was easier than we thought) took only twenty minutes.
  `),
  ...S('quotes', `
    She wrote "See you soon" at the bottom of the card.
    The teacher said, "Today we will learn something new about plants."
    On the door there was a sign that read "Quiet, please".
    "I am ready," said Anna, and she picked up her bag.
    The word "island" has a silent letter, and that is a bit tricky.
    He asked, "Can we try the experiment once more?"
    The poster says "Welcome to our school fair" in big yellow letters.
    My friend always answers "maybe" when he is not sure.
    The captain shouted, "Land ahead!" and everyone ran to the deck.
    Our class newspaper is called "The Green Page" and comes out every month.
  `),
  ...S('dashes', `
    Our classroom is bright - it has three big windows facing the sun.
    A well-known writer visited our school and talked about his books.
    This is a long-term project, so we work on it every week.
    Spring is my favourite season - everything wakes up after winter.
    My sister is a good swimmer - she trains twice a week.
    I met my old classmate - we talked for an hour.
    It was a clear, cold, star-filled night in the mountains.
    The kitchen smelled of fresh bread - it was ready at last.
    Take a mid-morning break and stretch your arms.
    Winter is the quietest season - even the streets seem to sleep.
  `),
];

export const PHRASES_EN = [
  ...S('phrases', `
    red, green, blue, yellow
    bread, cheese, apples, milk
    today, tomorrow, soon
    book, pen, bag, desk
    it's, don't, I'm, we're
    isn't, she's, they're, let's
    I'll, you're, that's, what's
    What? Where? Why? Who?
    How are you? What's new?
    Is it far? Can I help?
    Wow! Great job!
    Stop! Look out!
    Hello! Welcome!
    Note: be quiet
    Colours: red, blue, green
    Time: evening, weather: clear
    forest (big and quiet)
    city (old and busy)
    book (new, interesting)
    the word "home"
    a sign "Exit"
    say "hello" and "thanks"
    well-known, long-term, mid-term
    spring - a warm season
    winter - a cold season
    sun - a star
  `),
];

export const PARAGRAPHS_EN = [
  // ---------------- grade 5 ----------------
  P('5', 'space', `Space begins about one hundred kilometres above the ground. There is no air there, so there is no sound. Astronauts talk by radio and move slowly and carefully. From the window of their station they can see our blue planet, and many of them say that this is the best part of the job.`),
  P('5', 'nature', `In the morning the forest is quiet and fresh. A light fog lies between the trees, and drops of water shine on the leaves. Birds start their songs before the sun comes up. If you walk slowly, you can see a squirrel or even a shy deer. It is a perfect time for a walk.`),
  P('5', 'school', `Our class has a nice habit. Every Friday we tell each other about the most interesting event of the week. Someone talks about a trip, someone about a book, and someone about a funny dog on the street. It takes only a few minutes, but it makes us feel like a team.`),
  P('5', 'animals', `Bees work together like a well-tuned machine. Some of them collect nectar, others build the honeycomb, and a few guard the entrance. When a scout bee finds a field of flowers, she dances a special dance. The other bees watch her and learn where to fly.`),
  P('5', 'city', `In the evening the lamps in the city turn on and the streets change. The windows glow with warm yellow light, and trams ring at every corner. Musicians play quiet music in the square, and people stop to listen. The city is loud during the day and almost magical at night.`),
  P('5', 'food', `A good soup needs patience. First we clean the vegetables, then we cut them into small, even pieces. The water should boil gently, not too fast. When the smell reaches the next room, the soup is almost ready. We add fresh herbs at the very end, so they stay bright green.`),
  P('5', 'travel', `A journey starts at home, when we open the map. We look for the road, choose a few stops and make a list of things to take. The best backpack is light, but it has everything we need: water, a torch and a warm sweater. The rest we can buy on the way. Then the real adventure can begin.`),
  P('5', 'science', `Water has a strange property: it gets bigger when it freezes. That is why ice is lighter than water and floats on top. If it were different, rivers and lakes would freeze all the way down. Fish could not survive the winter, and nature would look very different.`),
  P('5', 'sport', `Riding a bike is safer when you know a few simple rules. A helmet protects your head, and reflectors make you visible in the dark. Before you leave, check the brakes and the tyres. On the road, keep to the right and show with your hand where you are going to turn.`),
  P('5', 'music', `Music is made of separate sounds, just like a word is made of letters. Every instrument has its own voice: a violin sings softly, and a drum sounds firm and clear. When an orchestra plays together, all the voices become one melody. The conductor makes no sound, but he leads everyone.`),
  P('5', 'weather', `Snow makes the night very quiet. The flakes fall slowly, and it seems that time slows down too. In the morning the yard looks different: the paths have disappeared, and the benches are white hills. Children run outside to build snowmen and to slide down the hill.`),
  P('5', 'sea', `The lighthouse stands on a rock and shines for ships at night. Its light can be seen from far away. Long ago a keeper lived there and lit the fire every evening. Now machines do the work, but the lamp is just as bright. Sailors say that the light of a lighthouse is the first thing they want to see.`),
  P('5', 'friends', `A real friend is not always like you. He may like other games, other music and even other colours. But it is interesting to talk to him, and you never have to ask him twice for help. When you argue, you find a way to make peace and you don't stay angry for long.`),
  P('5', 'books', `A library keeps thousands of stories. It is quiet between the shelves, and that is why it is easy to think there. The librarian can tell you where to start if you don't know what you like. You can also sit by the window and read until the evening comes.`),
  P('5', 'robots', `Robots already help people where work is dangerous or too heavy. They explore the deep sea, clean complicated machines and carry boxes in warehouses. But a smart machine only does the task that a person has given it. The ideas and the dreams still belong to us.`),

  // ---------------- grade 6 ----------------
  P('6', 'space', `People began to study space with a simple observation: they looked at the sky and noticed that the stars do not move in the same way. Some of them shine with a steady light, but others slowly travel between the constellations. Later, telescopes were invented, and distant worlds became closer. People saw mountains on the Moon, small moons around Jupiter and wide rings around Saturn. Every new discovery raised new questions, and we are still looking for the answers.`),
  P('6', 'computers', `A program is a list of clear commands that a computer follows. The computer cannot guess, so every small mistake turns into an error. Programmers like to say that a machine does exactly what you tell it, not what you meant. To find the reason for a failure, you have to go through the program step by step and look carefully at each result. It is a bit like a detective story, in which the guilty one is often a single extra symbol. That is why careful reading is so important for every programmer.`),
  P('6', 'forest', `A forest is not just a group of trees. It is a complicated community where everything is connected. Under the ground the roots of the trees join the thin threads of fungi, and plants share food through them. Tall trees take the sunlight, so only the plants that love shade grow beneath them. When an old tree falls, young shoots quickly reach for the free space. In this way the forest renews itself and loses nothing. A walk there teaches us to be quiet and to look closely.`),
  P('6', 'ocean', `The ocean covers most of our planet, but scientists know less about it than about the Moon. Light reaches only the upper layers of the water, and deeper down there is darkness and huge pressure. Strange fish with their own lamps live there, together with clear jellyfish and creatures that have never seen the sun. Researchers go down in strong vehicles to see these animals with their own eyes, and every trip brings something new. Maybe one day we will know the deep sea as well as our own streets.`),
  P('6', 'sport', `A marathon runner runs not only with the legs, but also with the head. She shares her strength, watches her breathing and drinks water on time. If someone starts too fast, there is a risk that he will simply have to stop before the end. Coaches advise running evenly, even when other runners pass you. The winner is not the one who starts first, but the one who finds the right rhythm and keeps it until the finish. This advice works not only in sports, but also in learning and in typing.`),
  P('6', 'mountains', `The weather in the mountains changes quickly. In the morning the sky can be clear, but by noon thick fog covers the top and a strong wind begins to blow. Experienced hikers always take warm clothes, even if it is hot at home. They know that the most important rule is to turn back in time, and not to reach the goal at any price. The mountain will not run away, and you can come again on a better day. That is a wise way to enjoy nature, and it keeps everybody safe.`),
  P('6', 'bread', `Dough for bread looks like a simple mix of flour, water and salt, but the real magic is made by yeast. These tiny living things eat sugar and make gas, and the dough grows. If you leave it in a warm place, it can become twice as big. The smell of fresh bread fills the kitchen, and the crust cracks when you break it. Perhaps people love baking because it needs time and patience, and gives joy in return. That is also why bread is a symbol of a warm welcome in many countries.`),
  P('6', 'ants', `Ants build complicated cities under the ground and inside old trees. Their homes have corridors, stores, rooms for the young and even small gardens where they grow fungi. Every ant knows its job: some look for food, others guard the entrance, and others take care of the babies. They talk with smells, so a whole group can quickly follow a single trail. Working together makes these tiny insects very strong. It sometimes seems that the whole nest is one big living body.`),
  P('6', 'cartoons', `An animated film is made of thousands of drawings, and each of them is a little different from the one before. When we see them one after another, our eyes see movement. Artists work for years on a few minutes of the screen and think about every gesture of the hero. Writers invent the story, and composers write music that makes the mood stronger. When you watch a cartoon, remember the big team behind every scene. One second of a film can take a week of work, and that is amazing.`),
  P('6', 'trains', `A train journey has a special charm. Outside the window the view changes slowly: fields, rivers and small stations with flowers on the platform. In the carriage you can read, play a board game or just sit quietly and watch the clouds. The conductor brings hot tea in a glass, and even in winter it feels warm. The road becomes an adventure of its own, and it is often as interesting as the place you are going to. New friends and good talks often begin in the carriage too.`),
  P('6', 'bridges', `People who built the first cities had no cranes, but they made high walls and arches. They knew that weight stays up well when it is shared in the right way. An arch rests on two sides, and the stone at the top keeps it from falling apart. Such a structure can stand for centuries, and sometimes for thousands of years. Modern engineers use computers, but they often return to these simple ideas, because geometry never changes. That is why old bridges are still standing, though their builders are long gone.`),
  P('6', 'storms', `Lightning is a huge electric spark that jumps between a cloud and the ground. It heats the air so strongly that the air expands at once, and we hear thunder. Light travels faster than sound, so first we see the flash and then we hear the noise. By counting the seconds between them, you can tell how far the storm is: the longer the pause, the farther it is. During a storm it is better to stay in a building and not to stand under a lonely tree. Knowing these simple rules helps us to stay calm during bad weather.`),
  P('6', 'water', `Clean water is one of the most valuable things we have, although we rarely think about it while it is there. Before it reaches our tap, it is collected, cleaned, checked and sent through pipes across the whole city. Each of us can help: we can turn off the tap while brushing our teeth, keep harmful liquids out of the drain and collect rainwater for the garden. Small steps that we take every day give a big result. After all, water is not endless, and we should take care of it every day.`),
  P('6', 'writing', `Writing was invented when people had too much to remember. At first these were simple signs on clay tablets, and people used them to count grain and animals. Slowly the signs began to mean sounds, and the first alphabets appeared. Every alphabet has its own story. The letters changed their shapes until they looked the way we know them. When we type words today, we use an old invention that has served people for thousands of years. So every word on the screen has a long story behind it.`),
  P('6', 'rest', `Rest is as important as work. The brain remembers better when we take short breaks between lessons. A walk in the park, a few stretches or just a look out of the window help us to collect our thoughts. Before you start the next exercise, drink some water and stand up for a moment. These minutes are not lost. They let you return to your task with fresh strength and a clear head. It is wise to rest before you are tired, and not after, so do not be shy to take a short break.`),
];
