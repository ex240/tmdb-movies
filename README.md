# TMDB Sci-Fi Movies

A React + Vite app that fetches science fiction movies from
[The Movie Database](https://www.themoviedb.org/) and shows them as a
responsive grid of cards.

## Getting started

Requires **Node.js 20.19 or newer**, enforced by `engines` in `package.json`.

```bash
npm install
npm start
```

Vite prints the URL on startup, by default <http://localhost:5173>, or the next
free port. Also available: `npm test`, `npm run test:watch`, `npm run build`,
`npm run preview`, `npm run lint`.

## Requirements

| Requirement | Implementation |
| --- | --- |
| Runs with `npm i && npm start` | `start` script added; Vite scaffolds only `dev` |
| Fetch `/discover/movie`, first page | One request on mount, 20 results into state |
| One filter on the API request | `with_genres=878` (Science Fiction) |
| Sort by a method and property | `Array.prototype.sort()` on `vote_average`, descending |
| Grid of cards | CSS Grid, responsive via `auto-fill` + `minmax` |
| — poster image | Built from `poster_path` |
| — title | `movie.title` |
| — one additional property | Release year *and* rating |
| — one interactive element | Hover lift, plus a sort dropdown and a Grid/List control |

Extras done: responsive grid, sorting UI, CSS transitions, alternate layout.
Sizing by rating was skipped — it needs `grid-auto-flow: dense`, which reorders
cards visually and would contradict the sort.

## Key decisions

**Filter — server-side.** `with_genres=878` means TMDB returns only the 20
movies we display. The id is named `SCI_FI_GENRE_ID`, not inlined.

**Sort — client-side.** TMDB offers a `sort_by` parameter, but sorting in
JavaScript lets the dropdown reorder the grid with no additional request:

```js
const sortedMovies = [...movies].sort((a, b) => {
  if (sortBy === 'year') {
    return b.release_date.localeCompare(a.release_date)
  }
  if (sortBy === 'title') {
    return a.title.localeCompare(b.title)
  }
  return b.vote_average - a.vote_average
})
```

The list is derived during render rather than held in state, so changing the sort
only re-renders and the one request stays in a mount-only effect. `[...movies]`
copies first because `sort()` mutates in place and React state must not be
modified directly. String fields use `localeCompare`; subtraction needs numbers.

**Real data needs guarding.**

- **Unreleased films report `vote_average: 0`.** Rendering `0.0` would mislead,
  so the card tests `vote_count === 0` and shows `NR`. Testing the count rather
  than the average means a film genuinely rated 0.0 still shows its score.
- **`poster_path` can be `null`.** Concatenating it would request `.../w500null`
  and render a broken image, so the card falls back to a same-sized placeholder.

**Styling** is plain CSS; custom properties in `index.css` drive light and dark
mode, and the Grid/List control swaps one container class, leaving cards
unchanged.

## API key

The key is committed in `src/App.jsx`. It was supplied publicly with the
assignment, and a `.env` file would break `npm i && npm start` unless the
reviewer created one first.

An environment variable would not hide it either: any key used by client-side
JavaScript is visible in the network tab. Keeping it secret needs a backend.

## Tests

```bash
npm test
```

21 tests run in jsdom with `fetch` mocked — no network, no browser. They cover the
loading and error paths, the request URL, all three sort orders, the `NR` and
missing-poster fallbacks, the layout control, and that sorting does not refetch.

They do not cover appearance: jsdom applies no CSS, so the grid, hover
transition, and list layout still need checking in a real browser.

## What I'd do next

- **A FastAPI backend proxy** holding the TMDB key, so it never reaches the
  client. It would also allow caching and rate limiting.
- **Pagination.** Only the first 20 results are fetched; `total_pages` comes back
  in the response and is unused.
- **A genre filter dropdown.** The genre is fixed; `/genre/movie/list` returns
  the full set to populate a control like the sort.
- **Keyboard focus styles.** The hover lift has no `:focus-visible` equivalent,
  so tabbing to a card or control shows no matching affordance.
