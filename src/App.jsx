import { useEffect, useState } from 'react'
import './App.css'

const API_KEY = '62df2cd3a4881de6558bc68cd67cca20'
const SCI_FI_GENRE_ID = 878
const DISCOVER_URL = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${SCI_FI_GENRE_ID}`
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500'

function App() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('rating')
  const [layout, setLayout] = useState('grid')

  useEffect(() => {
    async function loadMovies() {
      try {
        const response = await fetch(DISCOVER_URL)
        if (!response.ok) {
          throw new Error(`TMDB responded with ${response.status}`)
        }
        const data = await response.json()
        setMovies(data.results)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadMovies()
  }, [])

  const sortedMovies = [...movies].sort((a, b) => {
    if (sortBy === 'year') {
      return b.release_date.localeCompare(a.release_date)
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title)
    }
    return b.vote_average - a.vote_average
  })

  if (loading) {
    return (
      <main>
        <p>Loading movies…</p>
      </main>
    )
  }

  if (error) {
    return (
      <main>
        <p>Could not load movies: {error}</p>
      </main>
    )
  }

  return (
    <main>
      <h1>Sci-Fi Movies</h1>
      <div className="sort-control">
        <label htmlFor="sort">Sort by </label>
        <select
          id="sort"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
        >
          <option value="rating">Rating</option>
          <option value="year">Release Date</option>
          <option value="title">Title (A-Z)</option>
        </select>
        <button
          type="button"
          onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')}
        >
          {layout === 'grid' ? 'List view' : 'Grid view'}
        </button>
      </div>
      <ul className={layout === 'grid' ? 'movie-grid' : 'movie-list'}>
        {sortedMovies.map((movie) => (
          <li key={movie.id} className="movie-card">
            {movie.poster_path ? (
              <img
                className="poster"
                src={`${POSTER_BASE_URL}${movie.poster_path}`}
                alt={`Poster for ${movie.title}`}
                loading="lazy"
              />
            ) : (
              <div className="poster poster-missing">No poster</div>
            )}
            <h2 className="movie-title">{movie.title}</h2>
            <p className="movie-meta">
              <span>{movie.release_date ? movie.release_date.slice(0, 4) : '—'}</span>
              <span>
                {movie.vote_count === 0
                  ? 'NR'
                  : `★ ${movie.vote_average.toFixed(1)}`}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </main>

)
}

export default App
