# 📚 Tartila Book Publisher

A Book Publisher web frontend built with **React + Vite** and **Plain CSS**.

## Tech Stack

- **Framework**: React 18 + Vite 6
- **Routing**: React Router DOM v6
- **Styling**: Plain CSS (no framework)
- **Data**: Static mock data (no backend)

## Pages

| Route | Page |
|---|---|
| `/` | Landing page with hero, featured books, authors |
| `/books` | Book catalog with search and genre filter |
| `/books/:id` | Book detail page |
| `/authors` | Author profiles listing |
| `/authors/:id` | Author detail with their books |
| `/admin` | Admin dashboard with stats and books table |
| `/admin/books/new` | Book editor — create new book |
| `/admin/books/:id/edit` | Book editor — edit existing book |
| `/login` | Login form |
| `/register` | Registration form |

## Project Structure

```
src/
├── components/
│   ├── Navbar/       Navbar.jsx + Navbar.css
│   ├── Footer/       Footer.jsx + Footer.css
│   ├── BookCard/     BookCard.jsx + BookCard.css
│   └── AuthorCard/   AuthorCard.jsx + AuthorCard.css
├── data/
│   ├── books.js      Mock book data + helpers
│   └── authors.js    Mock author data + helpers
├── pages/
│   ├── Landing/
│   ├── BookCatalog/
│   ├── BookDetail/
│   ├── AuthorList/
│   ├── AuthorDetail/
│   ├── AdminDashboard/
│   ├── BookEditor/
│   ├── Login/
│   └── Register/
├── App.jsx           Router and layout
├── App.css
└── index.css         Global CSS variables and base styles
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:5173

# Production build
npm run build

# Preview production build
npm run preview
```

> **Note**: This is a frontend-only project using mock/static data. To connect to a real backend, replace the data helpers in `src/data/` with API calls.
