/* Shared BLOCK16 navigation rendered by the static Cloudflare Pages/Workers frontend. */
(() => {
  const mount = document.querySelector('[data-site-header]') || document.getElementById('header');
  if (!mount) return;

  const currentPath = window.location.pathname.toLowerCase();
  const links = [
    {label:'Home',href:'/',match:['/']},
    {label:'My Block16',href:'/profile.html',match:['/profile.html']},
    {label:'Games',href:'/games.html',match:['/games.html','/game.html']},
    {label:'Catalog',href:'/catalog.html',match:['/catalog.html']},
    {label:'Develop',href:'#',disabled:true},
    {label:'Membership',href:'/membership.html',match:['/membership.html']}
  ];

  const item = entry => {
    const active = entry.match && entry.match.includes(currentPath);
    return '<li'+(active?' class="current"':'')+'><a href="'+entry.href+'"'+
      (active?' aria-current="page"':'')+
      (entry.disabled?' aria-disabled="true" data-inactive-link':'')+'>'+entry.label+'</a></li>';
  };

  mount.innerHTML =
    '<div class="legacy-header-inner">'+
      '<a id="logo" href="/" aria-label="BLOCK16 home"><img src="/assets/block16-logo.svg" alt="BLOCK16"></a>'+
      '<button type="button" id="mobileNavigationToggle" class="mobile-navigation-toggle" '+
        'aria-controls="primary-navigation" aria-expanded="false" aria-label="Open navigation">'+
        '<span></span><span></span><span></span></button>'+
      '<nav class="legacy-navigation" id="primary-navigation" aria-label="Main navigation"><ul class="legacy-navigation-list">'+
        links.map(item).join('')+
        '<li class="legacy-more" id="legacyMore"><button type="button" class="legacy-more-toggle" aria-expanded="false" aria-controls="legacyMoreMenu">More <span class="legacy-arrow" aria-hidden="true"></span></button>'+
        '<ul class="legacy-dropdown" id="legacyMoreMenu" hidden><li><a href="/games.html">Browse games</a></li><li><a href="/catalog.html">Browse catalog</a></li><li><a href="/profile.html">Player profile</a></li><li><a href="#" aria-disabled="true" data-inactive-link>News</a></li><li><a href="#" aria-disabled="true" data-inactive-link>Help</a></li></ul></li>'+
      '</ul></nav>'+
      '<div id="account-navigation"><a id="loginButton" href="/account.html">Account</a></div>'+
    '</div>';

  const mobileToggle = mount.querySelector('#mobileNavigationToggle');
  const navigation = mount.querySelector('#primary-navigation');
  const closeMobile = () => {
    mobileToggle.setAttribute('aria-expanded','false');
    mobileToggle.setAttribute('aria-label','Open navigation');
    navigation.classList.remove('mobile-open');
  };
  mobileToggle.addEventListener('click', () => {
    const open = mobileToggle.getAttribute('aria-expanded') !== 'true';
    mobileToggle.setAttribute('aria-expanded',String(open));
    mobileToggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');
    navigation.classList.toggle('mobile-open',open);
  });

  const menu = mount.querySelector('#legacyMore');
  const toggle = mount.querySelector('.legacy-more-toggle');
  const dropdown = mount.querySelector('#legacyMoreMenu');
  const closeMore = () => {
    toggle.setAttribute('aria-expanded','false');
    dropdown.hidden = true;
    menu.classList.remove('active');
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded',String(open));
    dropdown.hidden = !open;
    menu.classList.toggle('active',open);
  });

  document.addEventListener('click', event => {
    if (!menu.contains(event.target)) closeMore();
    if (!mount.contains(event.target)) closeMobile();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMore();
      closeMobile();
      mobileToggle.focus();
    }
  });
  navigation.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => closeMobile());
  });
  mount.querySelectorAll('[data-inactive-link]').forEach(link => {
    link.addEventListener('click',event=>event.preventDefault());
  });
})();