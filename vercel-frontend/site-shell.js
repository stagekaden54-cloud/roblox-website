/* One accessible navigation component shared by every BLOCK16 page. */
(() => {
  const mount = document.querySelector('[data-site-header]') || document.getElementById('header');
  if (!mount) return;
  const currentPath = window.location.pathname.toLowerCase();
  const links = [
    {label:'Home',href:'/',match:['/']},
    {label:'My Block16',href:'/profile.html',match:['/profile.html']},
    {label:'Games',href:'/games.html',match:['/games.html','/game.html']},
    {label:'Catalog',href:'/catalog.html',match:['/catalog.html']},
    {label:'Build',href:'#',disabled:true},
    {label:'Membership',href:'/membership.html',match:['/membership.html']},
    {label:'Forum',href:'#',disabled:true}
  ];
  const item = entry => {
    const active = entry.match && entry.match.includes(currentPath);
    return '<li'+(active?' class="current"':'')+'><a href="'+entry.href+'"'+(active?' aria-current="page"':'')+(entry.disabled?' aria-disabled="true" data-inactive-link':'')+'>'+entry.label+'</a></li>';
  };
  mount.innerHTML = '<div class="legacy-header-inner">'+
    '<a id="logo" href="/" aria-label="BLOCK16 home"><img src="/assets/block16-logo.svg" alt="BLOCK16"></a>'+
    '<nav class="legacy-navigation" aria-label="Main navigation"><ul class="legacy-navigation-list">'+
    links.map(item).join('')+
    '<li class="legacy-more" id="legacyMore"><button type="button" class="legacy-more-toggle" aria-expanded="false" aria-controls="legacyMoreMenu">More <span class="legacy-arrow" aria-hidden="true"></span></button>'+
    '<ul class="legacy-dropdown" id="legacyMoreMenu" hidden><li><a href="/games.html">Browse games</a></li><li><a href="/catalog.html">Browse catalog</a></li><li><a href="#" aria-disabled="true" data-inactive-link>Contests</a></li><li><a href="#" aria-disabled="true" data-inactive-link>News</a></li><li><a href="#" aria-disabled="true" data-inactive-link>Help</a></li></ul></li>'+
    '</ul></nav><div id="login"><a id="loginButton" href="/account.html">Account</a></div></div>';
  const menu = mount.querySelector('#legacyMore');
  const toggle = mount.querySelector('.legacy-more-toggle');
  const dropdown = mount.querySelector('#legacyMoreMenu');
  const close = () => { toggle.setAttribute('aria-expanded','false'); dropdown.hidden = true; menu.classList.remove('active'); };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded',String(open));
    dropdown.hidden = !open;
    menu.classList.toggle('active',open);
  });
  document.addEventListener('click', event => { if (!menu.contains(event.target)) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { close(); toggle.focus(); } });
  mount.querySelectorAll('[data-inactive-link]').forEach(link => link.addEventListener('click',event=>event.preventDefault()));
})();
