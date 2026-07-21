(() => {
  const patched = new WeakSet();

  const applyHomepagePatch = () => {
    const section = document.querySelector('.trending-offices-section');
    if (!section || patched.has(section)) return;
    const page = section.closest('.page-stack');
    if (!page) return;

    page.querySelectorAll('.hero-panel').forEach((hero) => hero.remove());
    if (page.firstElementChild !== section) page.prepend(section);
    section.classList.add('safretak-offices-first');

    const marquee = section.querySelector('.office-marquee');
    const track = section.querySelector('.office-marquee-track');
    const groups = [...section.querySelectorAll('.office-marquee-group')];
    const primaryGroup = groups[0];
    groups.slice(1).forEach((group) => group.setAttribute('aria-hidden', 'true'));
    const cards = primaryGroup ? [...primaryGroup.querySelectorAll('.trending-office-card')] : [];

    if (!marquee || !track || !cards.length) {
      patched.add(section);
      return;
    }

    let active = 0;
    const dots = document.createElement('div');
    dots.className = 'safretak-office-dots';
    dots.setAttribute('aria-label', 'التنقل بين المكاتب الرائجة');

    const show = (index) => {
      active = ((index % cards.length) + cards.length) % cards.length;
      track.style.setProperty('--safretak-slide', String(active));
      cards.forEach((card, cardIndex) => card.classList.toggle('safretak-active', cardIndex === active));
      [...dots.children].forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === active));
    };

    if (cards.length > 1) {
      cards.forEach((card, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `عرض المكتب ${card.querySelector('strong')?.textContent || index + 1}`);
        dot.addEventListener('click', () => show(index));
        dots.append(dot);
      });
      marquee.after(dots);

      let timer = window.setInterval(() => {
        if (!document.contains(section)) {
          window.clearInterval(timer);
          return;
        }
        show(active + 1);
      }, 4200);

      section.addEventListener('mouseenter', () => window.clearInterval(timer));
      section.addEventListener('mouseleave', () => {
        window.clearInterval(timer);
        timer = window.setInterval(() => show(active + 1), 4200);
      });
    }

    show(0);
    patched.add(section);
  };

  const observer = new MutationObserver(applyHomepagePatch);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('popstate', () => window.setTimeout(applyHomepagePatch, 0));
  applyHomepagePatch();
})();
