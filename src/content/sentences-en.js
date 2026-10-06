// English sentences for grades 3–4 (лише дані): level A1, 3–7 words, capital letter and full stop. No apostrophes.

const S = (theme, text) => text.split('\n').map((t) => t.trim()).filter(Boolean).map((s) => ({ s, level: '3-4', theme }));

export const SENTENCES_EN = [
  ...S('animals', `
    The cat sleeps on the bed.
    My dog runs in the park.
    A bird sings in the tree.
    The frog jumps into the pond.
    The owl flies at night.
    A bee makes sweet honey.
    The rabbit eats a carrot.
    The fish swims in the river.
    The bear likes honey.
    A little duck swims with us.
    The horse runs in the field.
    The elephant has a long nose.
    The monkey likes bananas.
    A white sheep eats grass.
    The turtle walks very slowly.
  `),
  ...S('everyday', `
    I like red apples.
    She reads a funny book.
    We play in the garden.
    The sun is hot today.
    He drinks cold milk.
    I have a small blue ball.
    Mom cooks soup for lunch.
    Dad makes tea for us.
    We sing a happy song.
    My friend draws a rainbow.
    The kids play in the yard.
    Grandma bakes a sweet pie.
    I wash my hands before lunch.
    We walk to school together.
    The teacher shows a new letter.
    I read a story before bed.
    My sister has a red kite.
    The girl plays with a puppy.
    We build a snowman in winter.
    The moon shines in the sky.
    A small frog sits on a leaf.
    The baby smiles at the toy.
    I paint a yellow sun.
    We clap our hands and sing.
    The bus stops near the school.
    Tom feeds the hungry ducks.
    The cow gives us fresh milk.
    I love my family.
    A butterfly sits on a flower.
    We have a lesson at nine.
  `),
  ...S('with commas', `
    I like apples, pears and plums.
    It is sunny, so we play outside.
    My cat is soft, small and warm.
    I have a pen, a book.
    The sky is blue, the sun bright.
    We run, jump and laugh.
    Mom reads, and I draw.
    The cake is sweet, the tea hot.
    In spring, the flowers grow.
    In winter, we play in the snow.
    My friend is kind, funny and smart.
    The dog barks, the cat hides.
    We eat soup, bread and cheese.
    It is cold, so I wear gloves.
    The bird sings, and the bee buzzes.
    I see a tree, a bird.
    Dad cooks, and I help him.
    The house is big, the garden green.
    She sings, dances and smiles.
    We read, write and play at school.
  `),
];
