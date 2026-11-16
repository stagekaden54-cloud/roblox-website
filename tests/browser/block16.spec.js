const { test, expect } = require('@playwright/test');

test('homepage has its own title and renders the legacy landing area', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveTitle('BLOCK16 — Home');
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.locator('.legacy-games')).toBeVisible();
  await expect(page.locator('#logo img')).toHaveAttribute('alt', 'BLOCK16');
  expect(pageErrors).toEqual([]);
});

test('More navigation opens, closes, and supports Escape', async ({ page }) => {
  await page.goto('/');

  const toggle = page.getByRole('button', { name: 'More' });
  const menu = page.locator('#legacyMoreMenu');

  await expect(menu).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('Games page loads its catalogue and local search works', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/games.html');
  await expect(page).toHaveTitle('BLOCK16 — Games');
  await expect(page.getByRole('heading', { name: 'Games', exact: true })).toBeVisible();
  await expect(page.locator('.legacy-game-card')).toHaveCount(2);
  await expect(page.locator('#catalogueResultsStatus')).toHaveText('2 games shown');

  await page.getByRole('searchbox', { name: 'Search games' }).fill('cross');
  await expect(page.locator('.legacy-game-card')).toHaveCount(1);
  await expect(page.locator('.legacy-game-card h2')).toHaveText(['Crossroads']);
  await expect(page.locator('#catalogueResultsStatus')).toHaveText('1 game shown');

  await page.getByRole('searchbox', { name: 'Search games' }).fill('no matching title');
  await expect(page.locator('.legacy-game-card')).toHaveCount(0);
  await expect(page.locator('#catalogueEmptyState')).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('genre selection, sorting, and reset stay in sync', async ({ page }) => {
  await page.goto('/games.html');

  await page.locator('#genreFilter').selectOption('Classic');
  await expect(page.locator('.legacy-game-card')).toHaveCount(2);
  await expect(page.locator('.legacy-genre-button[data-genre="Classic"]'))
    .toHaveAttribute('aria-pressed', 'true');

  await page.locator('#sortFilter').selectOption('za');
  await expect(page.locator('.legacy-game-card h2')).toHaveText(['Swordfight', 'Crossroads']);

  await page.locator('#genreFilter').selectOption('Adventure');
  await expect(page.locator('.legacy-game-card')).toHaveCount(0);
  await expect(page.locator('#catalogueEmptyState')).toBeVisible();

  await page.locator('#resetGameFilters').click();
  await expect(page.locator('.legacy-game-card')).toHaveCount(2);
  await expect(page.locator('#genreFilter')).toHaveValue('');
  await expect(page.locator('#sortFilter')).toHaveValue('az');
  await expect(page.locator('#gameSearch')).toHaveValue('');
  await expect(page.locator('.legacy-genre-button[data-genre="Classic"]'))
    .toHaveAttribute('aria-pressed', 'false');
});

test('Catalog page renders legacy categories and local category selection works', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/catalog.html');
  await expect(page).toHaveTitle('BLOCK16 — Catalog');
  await expect(page.getByRole('heading', { name: 'Catalog', exact: true })).toBeVisible();
  await expect(page.locator('.catalog-category')).toHaveCount(9);
  await expect(page.getByRole('heading', { name: 'Avatar Items' })).toBeVisible();

  await page.getByRole('button', { name: 'Hat' }).click();
  await expect(page.locator('#selectedCategoryTitle')).toHaveText('Hat');
  await expect(page.locator('#catalogStatus')).toContainText('Hat selected');

  await page.getByRole('searchbox', { name: 'Find a category' }).fill('shirt');
  await expect(page.locator('.catalog-category')).toHaveCount(2);
  await expect(page.locator('#catalogEmpty')).toBeHidden();

  await page.locator('#catalogReset').click();
  await expect(page.locator('.catalog-category')).toHaveCount(9);
  await expect(page.locator('#catalogSelection')).toBeHidden();
  expect(pageErrors).toEqual([]);
});

test('Catalog navigation is linked from the homepage and Games page', async ({ page }) => {
  for (const path of ['/', '/games.html', '/catalog.html']) {
    await page.goto(path);
    await page.getByRole('link', { name: 'Catalog' }).click();
    await expect(page).toHaveURL(/\/catalog\.html$/);
    await expect(page).toHaveTitle('BLOCK16 — Catalog');
  }
});

test('archive gallery renders all three source-labelled images', async ({ page }) => {
  await page.goto('/games.html');

  const archive = page.locator('#legacyArchiveGrid');
  await expect(archive.locator('.legacy-archive-card')).toHaveCount(3);
  await expect(archive.locator('img')).toHaveCount(3);
  await expect(archive.locator('code')).toHaveCount(3);

  const imageSources = await archive.locator('img').evaluateAll(images =>
    images.map(image => image.getAttribute('src'))
  );
  expect(imageSources.every(source =>
    source && source.startsWith('https://raw.githubusercontent.com/stagekaden54-cloud/roblox-website/2016/')
  )).toBe(true);
});

test('mobile and desktop layouts do not create page-level horizontal overflow', async ({ page }) => {
  for (const path of ['/', '/games.html']) {
    await page.goto(path);
    await expect.poll(() => page.evaluate(() =>
      document.documentElement.scrollWidth <= document.documentElement.clientWidth
    )).toBe(true);
  }
});

test('Membership page uses modified legacy artwork and clearly disables purchases', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/membership.html');
  await expect(page).toHaveTitle('BLOCK16 — Membership');
  await expect(page.getByRole('heading', { name: 'BLOCK16 Membership' })).toBeVisible();
  await expect(page.locator('.membership-art-card')).toHaveCount(3);
  await expect(page.locator('.membership-art-card img')).toHaveCount(3);
  await expect(page.locator('.membership-notice')).toContainText('not active');
  await expect(page.getByRole('link', { name: 'Membership' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('button', { name: /purchase|subscribe|buy/i })).toHaveCount(0);

  const imageSources = await page.locator('.membership-art-card img').evaluateAll(images =>
    images.map(image => image.getAttribute('src'))
  );
  expect(imageSources).toEqual([
    '/assets/membership-artwork-blue.svg',
    '/assets/membership-artwork-silver.svg',
    '/assets/membership-artwork-gold.svg'
  ]);
  expect(pageErrors).toEqual([]);
});

test('Membership navigation is linked from all existing static pages', async ({ page }) => {
  for (const path of ['/', '/games.html', '/catalog.html', '/membership.html']) {
    await page.goto(path);
    await page.getByRole('link', { name: 'Membership' }).click();
    await expect(page).toHaveURL(/\/membership\.html$/);
    await expect(page).toHaveTitle('BLOCK16 — Membership');
  }
});

test('Membership layout does not overflow at desktop and mobile sizes', async ({ page }) => {
  await page.goto('/membership.html');
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth
  )).toBe(true);
});
