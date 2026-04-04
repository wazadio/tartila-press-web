export const books = [
  {
    id: 1,
    title: 'Jejak di Tanah Merah',
    authorId: 1,
    author: 'Ahmad Fuad',
    cover: 'https://placehold.co/300x420?text=Jejak+di+Tanah+Merah',
    genre: 'Historical Fiction',
    publishedYear: 2022,
    pages: 348,
    isbn: '978-602-1234-01-1',
    description:
      'A sweeping historical novel that traces three generations of a Javanese family from the colonial era to independence. Rich with local color and emotional depth, this book is a celebration of Indonesian resilience.',
    price: 89000,
    rating: 4.7,
    featured: true,
  },
  {
    id: 2,
    title: 'Bintang Kecil',
    authorId: 2,
    author: 'Siti Rahma',
    cover: 'https://placehold.co/300x420?text=Bintang+Kecil',
    genre: "Children's Literature",
    publishedYear: 2023,
    pages: 120,
    isbn: '978-602-1234-02-8',
    description:
      'A heartwarming story about a young girl named Nisa who discovers she has the power to grant small wishes using nothing but kindness and imagination.',
    price: 59000,
    rating: 4.9,
    featured: true,
  },
  {
    id: 3,
    title: 'Bayangan di Kota Lama',
    authorId: 3,
    author: 'Budi Santoso',
    cover: 'https://placehold.co/300x420?text=Bayangan+di+Kota+Lama',
    genre: 'Mystery',
    publishedYear: 2021,
    pages: 412,
    isbn: '978-602-1234-03-5',
    description:
      'A detective thriller set in the old quarters of Semarang. When a series of mysterious disappearances rock the city, journalist-turned-detective Arif must untangle a web of secrets buried in colonial history.',
    price: 95000,
    rating: 4.5,
    featured: true,
  },
  {
    id: 4,
    title: 'Puisi untuk Ibu',
    authorId: 4,
    author: 'Dewi Kartika',
    cover: 'https://placehold.co/300x420?text=Puisi+untuk+Ibu',
    genre: 'Poetry',
    publishedYear: 2023,
    pages: 96,
    isbn: '978-602-1234-04-2',
    description:
      'A collection of poems dedicated to mothers everywhere. Written with tenderness and honesty, Dewi Kartika explores the complex, beautiful bond between parent and child.',
    price: 75000,
    rating: 4.8,
    featured: false,
  },
  {
    id: 5,
    title: 'Langit Senja di Timur',
    authorId: 1,
    author: 'Ahmad Fuad',
    cover: 'https://placehold.co/300x420?text=Langit+Senja+di+Timur',
    genre: 'Literary Fiction',
    publishedYear: 2020,
    pages: 286,
    isbn: '978-602-1234-05-9',
    description:
      'A contemplative literary novel following a man\'s journey across eastern Indonesia, confronting questions of faith, modernity, and belonging.',
    price: 85000,
    rating: 4.4,
    featured: false,
  },
  {
    id: 6,
    title: 'Si Kancil dan Robot',
    authorId: 2,
    author: 'Siti Rahma',
    cover: 'https://placehold.co/300x420?text=Si+Kancil+dan+Robot',
    genre: "Children's Literature",
    publishedYear: 2022,
    pages: 88,
    isbn: '978-602-1234-06-6',
    description:
      'The classic trickster mouse-deer Kancil is back — but this time he teams up with a bumbling robot to outsmart a greedy landlord. Hilarious and full of heart.',
    price: 55000,
    rating: 4.6,
    featured: false,
  },
];

export function getBookById(id) {
  return books.find((b) => b.id === Number(id)) || null;
}

export function getBooksByAuthor(authorId) {
  return books.filter((b) => b.authorId === Number(authorId));
}

export function getFeaturedBooks() {
  return books.filter((b) => b.featured);
}

export const genres = [...new Set(books.map((b) => b.genre))];
