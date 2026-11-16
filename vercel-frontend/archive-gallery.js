/* BLOCK16 legacy artwork archive.
 * These are source images from the 2016 branch, not verified game records.
 * Do not infer titles, IDs, creators, ratings, or playable destinations.
 */
(() => {
  const sourceRoot = 'https://raw.githubusercontent.com/stagekaden54-cloud/roblox-website/2016/';
  const items = [
    {
      title: 'Legacy front-page scene',
      description: 'A preserved scene image from the 2016 website source. No matching game title or ID is recorded alongside this asset.',
      path: 'Website/Images/FrontPage.png',
      alt: 'Archived block-built scene with platforms, structures, and avatars.'
    },
    {
      title: 'Carousel artwork 3',
      description: 'A preserved carousel image. The source repository does not identify the experience shown.',
      path: 'Website/Images/GameCarousel/img3.jpg',
      alt: 'Archived carousel artwork showing an avatar in a colorful indoor environment.'
    },
    {
      title: 'Carousel artwork 5',
      description: 'A preserved carousel image. The source repository does not identify the experience shown.',
      path: 'Website/Images/GameCarousel/img5.jpg',
      alt: 'Archived carousel artwork showing a furnished house and outdoor area.'
    }
  ];

  const grid = document.getElementById('legacyArchiveGrid');
  if (!grid) return;

  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'legacy-archive-card';

    const image = document.createElement('img');
    image.src = sourceRoot + item.path;
    image.alt = item.alt;
    image.loading = 'lazy';
    image.decoding = 'async';

    const title = document.createElement('h3');
    title.textContent = item.title;

    const description = document.createElement('p');
    description.textContent = item.description;

    const source = document.createElement('code');
    source.textContent = 'Source: ' + item.path;

    card.append(image, title, description, source);
    grid.append(card);
  });
})();
