# Movie-Searcher

# Movie-Searcher

Simple static movie search UI that uses The Movie Database (TMDb) API to search for movies and show details.

Setup

1. Get a free API key from TMDb: https://www.themoviedb.org/settings/api
2. Open `script.js` and set the `TMDB_API_KEY` constant to your key.

Run locally

- Using Python 3 built-in server (recommended for a quick test):

```bash
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Notes

- TMDb requires an API key. The placeholder in `script.js` is `PUT_YOUR_TMDB_API_KEY_HERE`.
- Posters are loaded from TMDb's image service via `https://image.tmdb.org/t/p/w500`.
- If you prefer VS Code, use the Live Server extension.

Features

- Debounced search input
- Responsive card grid
- Details modal with overview, runtime, genres and IMDB link (when available)
- Loading states and basic error handling

Next steps you might want:

- Add pagination controls
- Cache results to reduce API calls
- Add keyboard navigation and accessibility refinements
