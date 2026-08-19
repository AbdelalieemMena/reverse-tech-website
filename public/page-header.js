document.addEventListener('DOMContentLoaded', () => {
  const languageButton = document.getElementById('pageLanguageToggle');
  const mobileButton = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  if (mobileButton && navLinks) {
    mobileButton.addEventListener('click', () => navLinks.classList.toggle('active'));
    navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', () => navLinks.classList.remove('active')));
  }
  let english = localStorage.getItem('reverseTechLanguage') === 'en';
  function applyLanguage() {
    document.documentElement.lang = english ? 'en' : 'ar';
    document.documentElement.dir = english ? 'ltr' : 'rtl';
    document.body.classList.toggle('english', english);
    if (languageButton) languageButton.querySelector('span').textContent = english ? 'العربية' : 'English';
    document.querySelectorAll('[data-ar][data-en]').forEach(el => {
      const value = english ? el.dataset.en : el.dataset.ar;
      if (el.matches('input,textarea') && el.hasAttribute('placeholder')) el.placeholder = value;
      else el.textContent = value;
    });
    localStorage.setItem('reverseTechLanguage', english ? 'en' : 'ar');
    document.dispatchEvent(new CustomEvent('reverseTechLanguageChanged', {detail:{english}}));
  }
  if (languageButton) languageButton.addEventListener('click', () => { english = !english; applyLanguage(); });
  applyLanguage();
});