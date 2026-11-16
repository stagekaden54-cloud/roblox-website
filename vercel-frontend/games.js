/* BLOCK16 static catalogue filters.
 * Genre labels and icon filenames are taken from the repository's 2016
 * Website/Images/GenreIcons directory. This page filters only the local
 * preview catalogue; it does not call legacy ASP.NET endpoints.
 */
(() => {
  const legacyImageRoot = 'https://raw.githubusercontent.com/stagekaden54-cloud/roblox-website/2016/Website/Images/GenreIcons/';
  const genres = [
    ['Adventure', 'Adventure.png'],
    ['Castle', 'Castle.png'],
    ['City', 'City.png'],
    ['Classic', 'Classic.png'],
    ['Cthulu', 'Cthulu.png'],
    ['FPS', 'FPS.png'],
    ['Fantasy', 'Fantasy.png'],
    ['Funny', 'Funny.png'],
    ['LOL', 'LOL.png'],
    ['Modern Military', 'ModernMilitary.png'],
    ['Ninja', 'Ninja.png'],
    ['Pirate', 'Pirate.png'],
    ['RPG', 'RPG.png'],
    ['Scary', 'Scary.png'],
    ['Sci-Fi', 'Sci-Fi.png'],
    ['Skatepark', 'Skatepark.png'],
    ['Sports', 'Sports.png'],
    ['Town and City', 'TownandCity.png'],
    ['Tutorial', 'Tutorial.png'],
    ['War', 'War.png'],
    ['Wild West', 'WildWest.png']
  ];

  // The two preview entries are intentionally limited to games already
  // represented by verified legacy artwork on this page.
  const games = [
    { id: 'crossroads', name: 'Crossroads', genre: 'Classic', artClass: 'crossroads-art' },
    { id: 'swordfight', name: 'Swordfight', genre: 'Classic', artClass: 'swordfight-art' }
  ];

  const genreSelect = document.getElementById('genreFilter');
  const sortSelect = document.getElementById('sortFilter');
  const searchInput = document.getElementById('gameSearch');
  const resetButton = document.getElementById('resetGameFilters');
  const grid = document.getElementById('legacyGameGrid');
  const status = document.getElementById('catalogueResultsStatus');
  const emptyState = document.getElementById('catalogueEmptyState');
  const genreList = document.getElementById('legacyGenreList');

  if (!genreSelect || !sortSelect || !searchInput || !grid || !status) return;

  genres.forEach(([name, icon]) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    genreSelect.append(option);

    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'legacy-genre-button';
    button.dataset.genre = name;
    button.setAttribute('aria-pressed', 'false');

    const image = document.createElement('img');
    image.src = legacyImageRoot + icon;
    image.alt = '';
    image.loading = 'lazy';
    image.width = 24;
    image.height = 24;

    const label = document.createElement('span');
    label.textContent = name;
    button.append(image, label);
    button.addEventListener('click', () => {
      genreSelect.value = genreSelect.value === name ? '' : name;
      render();
    });
    item.append(button);
    genreList.append(item);
  });

  function render() {
    const selectedGenre = genreSelect.value;
    const query = searchInput.value.trim().toLocaleLowerCase();
    const direction = sortSelect.value;

    const visibleGames = games
      .filter((game) => !selectedGenre || game.genre === selectedGenre)
      .filter((game) => !query || game.name.toLocaleLowerCase().includes(query))
      .sort((a, b) => direction === 'za'
        ? b.name.localeCompare(a.name)
        : a.name.localeCompare(b.name));

    grid.querySelectorAll('.legacy-game-card').forEach((card) => card.remove());
    visibleGames.forEach((game) => {
      const card = document.createElement('article');
      card.className = 'legacy-game-card';

      const art = document.createElement('a');
      art.className = 'legacy-game-art ' + game.artClass;
      art.href = '/game.html?id=' + encodeURIComponent(game.id);
      art.setAttribute('aria-label', 'View details for ' + game.name);
      const hiddenName = document.createElement('span');
      hiddenName.className = 'visually-hidden';
      hiddenName.textContent = 'View details for ' + game.name;
      art.append(hiddenName);

      const heading = document.createElement('h2');
      heading.textContent = game.name;

      const genreLabel = document.createElement('p');
      genreLabel.className = 'game-genre-label';
      genreLabel.textContent = game.genre;

      card.append(art, heading, genreLabel);
      grid.append(card);
    });

    const count = visibleGames.length;
    status.textContent = count + (count === 1 ? ' game shown' : ' games shown');
    emptyState.hidden = count !== 0;

    genreList.querySelectorAll('.legacy-genre-button').forEach((button) => {
      const active = button.dataset.genre === selectedGenre;
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function reset() {
    genreSelect.value = '';
    sortSelect.value = 'az';
    searchInput.value = '';
    render();
    searchInput.focus();
  }

  genreSelect.addEventListener('change', render);
  sortSelect.addEventListener('change', render);
  searchInput.addEventListener('input', render);
  resetButton.addEventListener('click', reset);
  render();
})();
