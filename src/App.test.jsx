import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

// Three movies chosen so that sorting by rating, release date, and title
// each produce a different order, and so that the edge cases we handle
// (no votes yet, missing poster) are both covered.
const MOVIES = [
  {
    id: 1,
    title: 'Interstellar',
    poster_path: '/interstellar.jpg',
    release_date: '2014-11-05',
    vote_average: 8.49,
    vote_count: 41381,
  },
  {
    id: 2,
    title: 'Avengers: Doomsday',
    poster_path: '/doomsday.jpg',
    release_date: '2026-12-16',
    vote_average: 0,
    vote_count: 0,
  },
  {
    id: 3,
    title: 'Blade Runner 2049',
    poster_path: null,
    release_date: '2017-10-04',
    vote_average: 7.6,
    vote_count: 15784,
  },
]

function mockFetchSuccess(results = MOVIES) {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ results }) }),
  )
}

/** Titles currently rendered, in the order they appear in the document. */
function renderedTitles() {
  return screen
    .getAllByRole('heading', { level: 2 })
    .map((heading) => heading.textContent)
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('loading and error states', () => {
  it('shows a loading message before the request resolves', () => {
    mockFetchSuccess()
    render(<App />)

    expect(screen.getByText('Loading movies…')).toBeInTheDocument()
  })

  it('replaces the loading message with the grid once data arrives', async () => {
    mockFetchSuccess()
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Sci-Fi Movies' })).toBeInTheDocument()
    expect(screen.queryByText('Loading movies…')).not.toBeInTheDocument()
  })

  it('shows an error when TMDB returns a failure status', async () => {
    // fetch does not reject on 4xx/5xx, so the component must check response.ok
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) }),
    )
    render(<App />)

    expect(
      await screen.findByText('Could not load movies: TMDB responded with 401'),
    ).toBeInTheDocument()
  })

  it('shows an error when the network request itself fails', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('Network down')))
    render(<App />)

    expect(await screen.findByText('Could not load movies: Network down')).toBeInTheDocument()
  })
})

describe('fetching', () => {
  it('requests the discover endpoint with the sci-fi genre filter', async () => {
    mockFetchSuccess()
    render(<App />)
    await screen.findByText('Interstellar')

    const url = globalThis.fetch.mock.calls[0][0]
    expect(url).toContain('/discover/movie')
    expect(url).toContain('with_genres=878')
  })

  it('renders every movie returned by the API', async () => {
    mockFetchSuccess()
    render(<App />)
    await screen.findByText('Interstellar')

    expect(renderedTitles()).toHaveLength(MOVIES.length)
  })
})

describe('sorting', () => {
  it('sorts by rating, highest first, by default', async () => {
    mockFetchSuccess()
    render(<App />)
    await screen.findByText('Interstellar')

    expect(renderedTitles()).toEqual([
      'Interstellar', // 8.49
      'Blade Runner 2049', // 7.6
      'Avengers: Doomsday', // 0
    ])
  })

  it('sorts by release date, newest first', async () => {
    mockFetchSuccess()
    render(<App />)
    await screen.findByText('Interstellar')

    await userEvent.selectOptions(screen.getByLabelText(/sort by/i), 'year')

    expect(renderedTitles()).toEqual([
      'Avengers: Doomsday', // 2026
      'Blade Runner 2049', // 2017
      'Interstellar', // 2014
    ])
  })

  it('sorts by title A-Z', async () => {
    mockFetchSuccess()
    render(<App />)
    await screen.findByText('Interstellar')

    await userEvent.selectOptions(screen.getByLabelText(/sort by/i), 'title')

    expect(renderedTitles()).toEqual([
      'Avengers: Doomsday',
      'Blade Runner 2049',
      'Interstellar',
    ])
  })

  it('does not refetch when the sort changes', async () => {
    mockFetchSuccess()
    render(<App />)
    await screen.findByText('Interstellar')
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)

    await userEvent.selectOptions(screen.getByLabelText(/sort by/i), 'title')
    await userEvent.selectOptions(screen.getByLabelText(/sort by/i), 'year')

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })
})

describe('card contents', () => {
  it('builds the poster URL from poster_path', async () => {
    mockFetchSuccess()
    render(<App />)

    const poster = await screen.findByAltText('Poster for Interstellar')
    expect(poster).toHaveAttribute(
      'src',
      'https://image.tmdb.org/t/p/w500/interstellar.jpg',
    )
  })

  it('falls back to a placeholder when poster_path is null', async () => {
    mockFetchSuccess()
    render(<App />)
    await screen.findByText('Interstellar')

    expect(screen.getByText('No poster')).toBeInTheDocument()
    expect(screen.queryByAltText('Poster for Blade Runner 2049')).not.toBeInTheDocument()
  })

  it('shows the release year only', async () => {
    mockFetchSuccess()
    render(<App />)
    await screen.findByText('Interstellar')

    expect(screen.getByText('2014')).toBeInTheDocument()
    expect(screen.queryByText('2014-11-05')).not.toBeInTheDocument()
  })

  it('rounds the rating to one decimal place', async () => {
    mockFetchSuccess()
    render(<App />)
    await screen.findByText('Interstellar')

    expect(screen.getByText('★ 8.5')).toBeInTheDocument()
  })

  it('shows NR instead of 0.0 when a film has no votes yet', async () => {
    mockFetchSuccess()
    render(<App />)
    await screen.findByText('Interstellar')

    expect(screen.getByText('NR')).toBeInTheDocument()
    expect(screen.queryByText('★ 0.0')).not.toBeInTheDocument()
  })

  it('still shows a score when a film is genuinely rated 0 by real voters', async () => {
    mockFetchSuccess([{ ...MOVIES[0], vote_average: 0, vote_count: 500 }])
    render(<App />)
    await screen.findByText('Interstellar')

    expect(screen.getByText('★ 0.0')).toBeInTheDocument()
    expect(screen.queryByText('NR')).not.toBeInTheDocument()
  })
})

describe('layout toggle', () => {
  it('starts in grid layout', async () => {
    mockFetchSuccess()
    render(<App />)
    await screen.findByText('Interstellar')

    expect(screen.getByRole('list')).toHaveClass('movie-grid')
    expect(screen.getByRole('button', { name: 'List view' })).toBeInTheDocument()
  })

  it('switches to list layout and back', async () => {
    mockFetchSuccess()
    render(<App />)
    await screen.findByText('Interstellar')

    await userEvent.click(screen.getByRole('button', { name: 'List view' }))
    expect(screen.getByRole('list')).toHaveClass('movie-list')

    await userEvent.click(screen.getByRole('button', { name: 'Grid view' }))
    expect(screen.getByRole('list')).toHaveClass('movie-grid')
  })

  it('keeps the chosen sort when the layout changes', async () => {
    mockFetchSuccess()
    render(<App />)
    await screen.findByText('Interstellar')

    await userEvent.selectOptions(screen.getByLabelText(/sort by/i), 'title')
    await userEvent.click(screen.getByRole('button', { name: 'List view' }))

    expect(renderedTitles()).toEqual([
      'Avengers: Doomsday',
      'Blade Runner 2049',
      'Interstellar',
    ])
  })
})
