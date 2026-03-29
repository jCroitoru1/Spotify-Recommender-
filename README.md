# Music Genre Intelligence Dashboard

Interactive music analytics dashboard built from Spotify artist exports. The project is designed to be easy to publish on GitHub Pages while still giving you a strong resume story around data exploration, client-side visualization, and product-style presentation.

## What it shows

- Genre-by-genre artist popularity comparisons
- Top artists within each exported genre
- Distribution of artists across popularity tiers
- Cross-genre overlap for artists appearing in multiple exports

## Why it works as a resume project

- Uses real scraped/exported data instead of tutorial sample data
- Frames analysis through a clean interface, not only notebooks
- Demonstrates storytelling, front-end polish, and analytical thinking

## Run it

Because the dashboard reads CSV files in the browser, it works best when hosted on GitHub Pages or served from a local static server.

## Repo structure

- `index.html` contains the dashboard layout
- `styles.css` contains the visual system
- `app.js` parses the CSVs and renders the dashboard
- `data/` contains the copied genre exports
