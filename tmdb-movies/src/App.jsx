import { useEffect, useState } from 'react'
import './App.css'

const API_KEY = '62df2cd3a4881de6558bc68cd67cca20'
const SCI_FI_GENRE_ID = 878
const DISCOVER_URL = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${SCI_FI_GENRE_ID}`

function App() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  const sortedMovies = [...movies].sort(
    (a, b) => b.vote_average - a.vote_average,
  )

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
      <ul>
        {sortedMovies.map((movie) => (
          <li key={movie.id}>
            {movie.title} — {movie.vote_average.toFixed(1)}
          </li>
        ))}
      </ul>
    </main>
  )
}

export default App
