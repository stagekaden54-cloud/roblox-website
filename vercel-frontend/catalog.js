/* Category directory based on verified 2016 Website/Images/AssetIcons assets.
 * This is category navigation only: no item inventory, prices, creators, or purchase actions are fabricated.
 */
(() => {
  const imageRoot = 'https://raw.githubusercontent.com/stagekaden54-cloud/roblox-website/2016/Website/Images/AssetIcons/';
  const groups = [
    { id: 'avatarCategoryGrid', items: [
      ['Hat', 'Hat.png', 'Wearable avatar headwear.'],
      ['Face', 'Face.png', 'Avatar face category.'],
      ['Head', 'Head.png', 'Avatar head category.'],
      ['Shirt', 'Shirt.png', 'Classic shirt category.'],
      ['Pants', 'Pants.png', 'Classic pants category.'],
      ['T-Shirt', 'TShirt.png', 'Classic T-shirt category.']
    ]},
    { id: 'communityCategoryGrid', items: [
      ['Decal', 'Decal.png', 'Image decal category.'],
      ['Model', 'Model.png', 'Model asset category.']
    ]},
    { id: 'otherCategoryGrid', items: [
      ['Classic', 'Classic.png', 'Classic catalog category.']
    ]}
  ];
  const categories = groups.flatMap(group => group.items);
  const search = document.getElementById('catalogSearch');
  const reset = document.getElementById('catalogReset');
  const status = document.getElementById('catalogStatus');
  const empty = document.getElementById('catalogEmpty');
  const selection = document.getElementById('catalogSelection');
  const selectedTitle = document.getElementById('selectedCategoryTitle');
  const selectedDescription = document.getElementById('selectedCategoryDescription');
  let selected = '';

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    groups.forEach(group => {
      const container = document.getElementById(group.id);
      container.replaceChildren();
      group.items.filter(([name]) => !query || name.toLocaleLowerCase().includes(query))
        .forEach(([name, icon]) => {
          visible += 1;
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'catalog-category';
          button.setAttribute('aria-pressed', String(selected === name));
          button.dataset.category = name;
          const image = document.createElement('img');
          image.src = imageRoot + icon;
          image.alt = '';
          image.loading = 'lazy';
          image.width = 42;
          image.height = 42;
          const label = document.createElement('span');
          label.textContent = name;
          button.append(image, label);
          button.addEventListener('click', () => {
            selected = selected === name ? '' : name;
            render();
          });
          container.append(button);
        });
      container.closest('.catalog-group').hidden = container.children.length === 0;
    });
    empty.hidden = visible !== 0;
    status.textContent = visible + (visible === 1 ? ' category shown' : ' categories shown') +
      (selected ? ' · ' + selected + ' selected' : '');
    const active = categories.find(([name]) => name === selected);
    selection.hidden = !active;
    if (active) {
      selectedTitle.textContent = active[0];
      selectedDescription.textContent = active[2];
    }
  }

  search.addEventListener('input', render);
  reset.addEventListener('click', () => {
    search.value = '';
    selected = '';
    render();
    search.focus();
  });
  render();
})();
