/* Static BLOCK16 game detail records.
 * Only entries with verified legacy catalogue artwork are listed here.
 * No live player counts, creator identities, or launch endpoints are fabricated.
 */
(() => {
  const games = {
    crossroads: {
      name: 'Crossroads',
      genre: 'Classic',
      artClass: 'crossroads-art',
      description: 'A classic arena-style experience represented in the preserved legacy games artwork.'
    },
    swordfight: {
      name: 'Swordfight',
      genre: 'Classic',
      artClass: 'swordfight-art',
      description: 'A classic sword-based arena experience represented in the preserved legacy games artwork.'
    }
  };

  const params = new URLSearchParams(window.location.search);
  const game = games[params.get('id')];
  const container = document.getElementById('gameDetails');

  if (!game) {
    container.innerHTML = '<div class="game-not-found"><h1>Game not found</h1><p>This game is not included in the current BLOCK16 preview catalogue.</p><a href="/games.html">Return to Games</a></div>';
    document.title = 'BLOCK16 — Game Not Found';
    return;
  }

  document.title = 'BLOCK16 — ' + game.name;
  const art = document.createElement('div');
  art.className = 'game-details-art legacy-game-art ' + game.artClass;
  art.setAttribute('role', 'img');
  art.setAttribute('aria-label', game.name + ' legacy game artwork');

  const copy = document.createElement('div');
  copy.className = 'game-details-copy';

  const heading = document.createElement('h1');
  heading.textContent = game.name;

  const genre = document.createElement('p');
  genre.className = 'game-details-genre';
  genre.textContent = 'Genre: ' + game.genre;

  const description = document.createElement('p');
  description.className = 'game-details-description';
  description.textContent = game.description;

  const play = document.createElement('button');
  play.className = 'game-launch-button';
  play.type = 'button';
  play.disabled = true;
  play.textContent = 'Play — Coming Soon';

  const note = document.createElement('p');
  note.className = 'game-launch-note';
  note.textContent = 'Game launching is not connected in this preview yet.';

  copy.append(heading, genre, description, play, note);
  container.replaceChildren(art, copy);
})();
