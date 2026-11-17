(() => {
  const tabs = [...document.querySelectorAll('[data-profile-tab]')];
  const panels = [...document.querySelectorAll('[data-profile-panel]')];
  tabs.forEach(tab => tab.addEventListener('click', () => {
    const selected = tab.dataset.profileTab;
    tabs.forEach(button => {
      const active = button === tab;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',String(active));
    });
    panels.forEach(panel => { panel.hidden = panel.dataset.profilePanel !== selected; });
  }));
})();
