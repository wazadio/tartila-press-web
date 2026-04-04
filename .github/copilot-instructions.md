# Tartila Book Publisher - Copilot Instructions

## Project Overview
Book Publisher web frontend built with React + Vite and Plain CSS.

## Stack
- **Framework**: React 18 + Vite
- **Styling**: Plain CSS (no CSS framework)
- **Data**: Mock/static data (no backend)
- **Routing**: React Router DOM

## Pages
- `/` - Landing page
- `/books` - Book catalog
- `/books/:id` - Book detail
- `/authors` - Author profiles
- `/authors/:id` - Author detail
- `/admin` - Admin dashboard
- `/admin/books/new` - Book editor (create)
- `/admin/books/:id/edit` - Book editor (edit)
- `/login` - Login
- `/register` - Register

## Conventions
- Use functional components with hooks
- Keep components in `src/components/`
- Keep pages in `src/pages/`
- Keep mock data in `src/data/`
- Keep CSS files co-located with their component (e.g. `Button.css` next to `Button.jsx`)
- Follow PEP8 equivalents for JS: ESLint rules, camelCase vars, PascalCase components
- No hardcoded secrets; use `.env` for any config values
- Validate all user inputs in forms
