# TMDB Sci-Fi Movies

A small React + Vite app that fetches science fiction movies from
[The Movie Database](https://www.themoviedb.org/) and displays them as a
responsive grid of cards.

## Getting started

Requires **Node.js 20.19 or newer** — Vite 8 and its plugins require that range,
and `package.json` sets a matching `engines` field so `npm install` warns
immediately rather than failing later with a stack of engine errors. Check with
`node -v`.

```bash
npm install
npm start
```

Vite prints the local URL on startup — by default <http://localhost:5173>.
If that port is already in use, Vite picks the next free one, so open
whichever URL it prints.

## What it does

On load, the app makes a single request to TMDB's `/discover/movie` endpoint,
stores the 20 results in state, sorts them by rating, and renders each one as a
card showing its poster, title, release year, and score.

## Decisions

**Filter — science fiction, applied in the API request.**
The request sends `with_genres=878` (TMDB's Science Fiction genre id), so the
filtering happens server-side and we only receive the 20 movies we intend to
display. Hard-coding `878` inline would have been opaque, so it is named
`SCI_FI_GENRE_ID`.

**Sort — applied in JavaScript, by rating by default.**
TMDB offers a `sort_by` query parameter, but the movies are sorted client-side
with `Array.prototype.sort()`, defaulting to `vote_average` descending:

```js
const sortedMovies = [...movies].sort((a, b) => {
  if (sortBy === 'year') return b.release_date.localeCompare(a.release_date)
  if (sortBy === 'title') return a.title.localeCompare(b.title)
  return b.vote_average - a.vote_average
})
```

Sorting locally means the sort control reorders the grid instantly with no
additional network request. The spread (`[...movies]`) copies the array first,
because `sort()` mutates in place and React state must not be modified directly.

**Sort control.**
A dropdown switches between rating, release date, and title. The active sort is
held in state and the `<select>` is driven by it, so React state is the single
source of truth for the control. The sorted list is derived during render rather
than stored in its own state — changing the dropdown only re-renders, and the
one network request stays in a mount-only effect.

Release dates are compared with `localeCompare` rather than subtraction, since
they arrive as strings. `YYYY-MM-DD` sorts alphabetically and chronologically
alike, so no date parsing is needed.

**Additional card properties — release year and rating.**
`release_date` arrives as a full date string (`"2014-11-05"`), so only the year
is shown. `vote_average` arrives as a float (`7.915`) and is rounded for display.

**Layout control.**
A two-button segmented control switches between a poster grid and a
single-column list. Both options stay visible with the active one highlighted,
rather than a single button that only names its destination, so the current
layout is readable at a glance. `aria-pressed` carries that same state to
assistive technology.

The cards themselves are unchanged in either mode — only the class on the
container changes, and the list rules override the grid ones by being more
specific.

**Interactive element — hover.**
Cards lift with `transform: translateY(-4px)` and gain a shadow on hover. The
`transition` is declared on the base `.movie-card` rule rather than on `:hover`,
so the animation plays in both directions.

## Handling real data

Two cases that the live API actually returns:

- **Unreleased films have no rating.** TMDB reports `vote_average: 0` for titles
  nobody has voted on yet, which would render a misleading `0.0`. The card checks
  `vote_count === 0` and shows `NR` instead. Testing `vote_count` rather than
  `vote_average` means a film genuinely rated 0.0 by real voters still displays
  its score.
- **`poster_path` can be `null`.** Concatenating a null path would request
  `.../w500null` and render a broken image, so the card falls back to a
  placeholder that occupies the same space, keeping the grid aligned.

## Styling notes

Plain CSS, no framework.

- The grid is a single declaration —
  `grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))` — so the column
  count recalculates as the viewport changes. No media queries.
- Colors are CSS custom properties defined in `src/index.css` and consumed via
  `var()` in `src/App.css`. A `prefers-color-scheme: dark` block redefines those
  variables, so dark mode works without any dark-specific component styles.
- `aspect-ratio: 2 / 3` reserves each poster's shape before the image loads,
  preventing layout shift as images stream in.
- Cards are flex columns with `margin-top: auto` on the meta row, so the
  year/rating line sits flush with the bottom of every card regardless of
  whether the title wraps to a second line.

## A note on the API key

The TMDB API key is committed directly in `src/App.jsx`. This is deliberate: the
key was supplied publicly with the assignment, and moving it to a `.env` file
would break the `npm install && npm start` requirement unless the reviewer
created that file first.

In a production app this key would live in an environment variable, and ideally
the request would be proxied through a backend so the key never reaches the
browser at all — any key used by client-side JavaScript is visible in the
network tab regardless of how it is stored.

## Tests

```bash
npm test
```

21 tests run against a fake DOM (jsdom) with `fetch` mocked, so they need no
network and no browser. They cover the loading and error paths, the request
URL, all three sort orders, the `NR` and missing-poster fallbacks, the layout
control and its active state, and the fact that changing the sort does not
refetch.

They do not cover appearance — jsdom applies no CSS, so the grid, hover
transition, and list layout still need checking in a real browser.

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the dev server |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Re-run tests on change |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run Oxlint |

## Project structure

```
src/
  App.jsx        fetch, sort, and render the grid
  App.test.jsx   tests for the above
  App.css        grid, list, card, and hover styles
  index.css      global styles, color variables, dark mode
  main.jsx       mounts App into the page
  setupTests.js  registers jest-dom matchers for Vitest
```
