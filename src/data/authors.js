export const authors = [
  {
    id: 1,
    name: 'Ahmad Fuad',
    photo: 'https://placehold.co/200x200?text=AF',
    bio: 'Ahmad Fuad is an award-winning novelist known for his poetic prose and exploration of Indonesian cultural identity. He has published over fifteen books and received multiple national literary awards.',
    nationality: 'Indonesian',
    booksPublished: 6,
    genres: ['Literary Fiction', 'Historical Fiction'],
    website: 'https://example.com/ahmad-fuad',
  },
  {
    id: 2,
    name: 'Siti Rahma',
    photo: 'https://placehold.co/200x200?text=SR',
    bio: 'Siti Rahma is a bestselling author of children\'s literature and young adult fiction. Her works are beloved for their warmth, humor, and relatable characters.',
    nationality: 'Indonesian',
    booksPublished: 9,
    genres: ["Children's Literature", 'Young Adult'],
    website: 'https://example.com/siti-rahma',
  },
  {
    id: 3,
    name: 'Budi Santoso',
    photo: 'https://placehold.co/200x200?text=BS',
    bio: 'Budi Santoso writes gripping thrillers and mystery novels set across Southeast Asia. A former journalist, his writing blends detailed research with fast-paced narrative.',
    nationality: 'Indonesian',
    booksPublished: 5,
    genres: ['Thriller', 'Mystery'],
    website: 'https://example.com/budi-santoso',
  },
  {
    id: 4,
    name: 'Dewi Kartika',
    photo: 'https://placehold.co/200x200?text=DK',
    bio: 'Dewi Kartika is a poet and essayist whose work explores themes of feminism, spirituality, and modern Indonesian life. She is a prominent voice in contemporary Indonesian literature.',
    nationality: 'Indonesian',
    booksPublished: 4,
    genres: ['Poetry', 'Essays'],
    website: 'https://example.com/dewi-kartika',
  },
];

export function getAuthorById(id) {
  return authors.find((a) => a.id === Number(id)) || null;
}
