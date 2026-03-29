const genreFiles = [
  { id: "rock", label: "Rock", file: "data/rock_artists_data.csv" },
  { id: "rap", label: "Rap", file: "data/rap_artists_data.csv" },
  { id: "pop", label: "Pop", file: "data/pop_artists_data.csv" },
  { id: "house", label: "House", file: "data/house_artists_data.csv" },
  { id: "edm", label: "EDM", file: "data/edm_artists_data.csv" },
  { id: "grunge", label: "Grunge", file: "data/grunge_artists_data.csv" },
  { id: "rnb", label: "R&B", file: "data/rnb_artists_data.csv" },
];

const state = {
  selectedGenre: "rock",
  dataByGenre: {},
};

const elements = {
  filters: document.querySelector("#genre-filters"),
  totalArtists: document.querySelector("#total-artists"),
  avgPopularity: document.querySelector("#avg-popularity"),
  topArtist: document.querySelector("#top-artist"),
  topArtistScore: document.querySelector("#top-artist-score"),
  leaderboard: document.querySelector("#leaderboard"),
  leaderboardCaption: document.querySelector("#leaderboard-caption"),
  tiers: document.querySelector("#tiers"),
  genreBars: document.querySelector("#genre-bars"),
  overlapList: document.querySelector("#overlap-list"),
};

function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      if (current.length > 0 || row.length > 0) {
        row.push(current);
        rows.push(row);
      }

      current = "";
      row = [];
      continue;
    }

    current += character;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  const [headers, ...body] = rows;
  return body
    .filter((entry) => entry.length === headers.length)
    .map((entry) => Object.fromEntries(entry.map((value, index) => [headers[index], value])));
}

function parseGenres(rawValue) {
  return rawValue
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((item) => item.trim().replace(/^'+|'+$/g, ""))
    .filter(Boolean);
}

function normalizeArtist(record) {
  return {
    name: record.name,
    popularity: Number(record.popularity) || 0,
    genres: parseGenres(record.genres || ""),
  };
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getTierSummary(records) {
  const buckets = [
    { label: "80-100: breakout tier", min: 80, max: 100 },
    { label: "60-79: strong traction", min: 60, max: 79 },
    { label: "40-59: established niche", min: 40, max: 59 },
    { label: "0-39: long tail", min: 0, max: 39 },
  ];

  return buckets.map((bucket) => {
    const count = records.filter((record) => record.popularity >= bucket.min && record.popularity <= bucket.max).length;
    const share = records.length ? Math.round((count / records.length) * 100) : 0;

    return { ...bucket, count, share };
  });
}

function getOverlapSummary() {
  const artistMap = new Map();

  genreFiles.forEach((genre) => {
    const records = state.dataByGenre[genre.id] || [];

    records.forEach((record) => {
      const key = record.name.toLowerCase();
      const current = artistMap.get(key) || { name: record.name, genres: new Set() };
      current.genres.add(genre.label);
      artistMap.set(key, current);
    });
  });

  return Array.from(artistMap.values())
    .filter((entry) => entry.genres.size > 1)
    .map((entry) => ({
      name: entry.name,
      count: entry.genres.size,
      genres: Array.from(entry.genres).sort(),
    }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 6);
}

function renderFilters() {
  elements.filters.innerHTML = "";

  genreFiles.forEach((genre) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-button${genre.id === state.selectedGenre ? " is-active" : ""}`;
    button.textContent = genre.label;
    button.addEventListener("click", () => {
      state.selectedGenre = genre.id;
      renderFilters();
      renderDashboard();
    });

    elements.filters.appendChild(button);
  });
}

function renderDashboard() {
  const selected = genreFiles.find((genre) => genre.id === state.selectedGenre);
  const records = [...(state.dataByGenre[state.selectedGenre] || [])].sort((left, right) => right.popularity - left.popularity);
  const topFive = records.slice(0, 5);
  const topArtist = topFive[0];
  const avgPopularity = average(records.map((record) => record.popularity));

  elements.totalArtists.textContent = records.length.toLocaleString();
  elements.avgPopularity.textContent = avgPopularity.toFixed(1);
  elements.topArtist.textContent = topArtist ? topArtist.name : "No data";
  elements.topArtistScore.textContent = topArtist ? `Popularity score: ${topArtist.popularity}` : "Highest popularity score unavailable.";
  elements.leaderboardCaption.textContent = `Top five artists in the ${selected.label} export.`;

  elements.leaderboard.innerHTML = topFive
    .map((artist, index) => `
      <article class="leader-row">
        <span class="rank-badge">#${index + 1}</span>
        <div>
          <strong class="leader-name">${artist.name}</strong>
          <span class="leader-meta">${artist.genres.slice(0, 3).join(", ") || "Genre tags unavailable"}</span>
        </div>
        <span class="score-pill">${artist.popularity}</span>
      </article>
    `)
    .join("");

  elements.tiers.innerHTML = getTierSummary(records)
    .map((tier) => `
      <article class="tier-row">
        <div class="bar-header">
          <strong>${tier.label}</strong>
          <span>${tier.count} artists • ${tier.share}%</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${tier.share}%"></div>
        </div>
      </article>
    `)
    .join("");

  const genreAverages = genreFiles.map((genre) => {
    const genreRecords = state.dataByGenre[genre.id] || [];
    return {
      label: genre.label,
      averagePopularity: average(genreRecords.map((record) => record.popularity)),
      totalArtists: genreRecords.length,
      isSelected: genre.id === state.selectedGenre,
    };
  });

  const maxAverage = Math.max(...genreAverages.map((genre) => genre.averagePopularity), 1);

  elements.genreBars.innerHTML = genreAverages
    .sort((left, right) => right.averagePopularity - left.averagePopularity)
    .map((genre) => {
      const width = (genre.averagePopularity / maxAverage) * 100;
      return `
        <article class="bar-row">
          <div class="bar-header">
            <span>${genre.label}${genre.isSelected ? " • selected" : ""}</span>
            <span>${genre.averagePopularity.toFixed(1)} avg • ${genre.totalArtists} artists</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${width}%"></div>
          </div>
        </article>
      `;
    })
    .join("");

  const overlapSummary = getOverlapSummary();
  elements.overlapList.innerHTML = overlapSummary
    .map((entry) => `
      <article class="overlap-item">
        <div>
          <strong>${entry.name}</strong>
          <span>${entry.genres.join(", ")}</span>
        </div>
        <span class="overlap-pill">${entry.count} genres</span>
      </article>
    `)
    .join("");
}

async function loadData() {
  const results = await Promise.all(
    genreFiles.map(async (genre) => {
      const response = await fetch(genre.file);
      const text = await response.text();
      return [genre.id, parseCsv(text).map(normalizeArtist)];
    }),
  );

  state.dataByGenre = Object.fromEntries(results);
  renderFilters();
  renderDashboard();
}

loadData().catch(() => {
  document.querySelector(".dashboard").innerHTML = `
    <section class="panel controls">
      <div>
        <p class="eyebrow">Load Error</p>
        <h2>The dashboard could not read the CSV files.</h2>
        <p>If you are opening this locally, try serving the folder with a simple local server or publish it to GitHub Pages.</p>
      </div>
    </section>
  `;
});
