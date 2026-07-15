document.addEventListener('DOMContentLoaded', () => {
  function pickRandomProduct(excludeUrl) {
    const cards = Array.from(document.querySelectorAll('.card-wrapper'));
    if (!cards.length) return null;

    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    for (const card of cards) {
      const link = card.querySelector('.full-unstyled-link');
      if (!link) continue;

      const name = link.textContent.trim();
      const url = link.getAttribute('href');

      if (name && url && url !== excludeUrl) {
        return { name, url };
      }
    }

    return null;
  }

  const pickHooks = [
    { emoji: '⭐', label: 'Producto de la semana' },
    { emoji: '🔥', label: 'Más vendido' },
    { emoji: '📈', label: 'Tendencia ahora' },
    { emoji: '💖', label: 'Favorito de clientes' },
    { emoji: '🏆', label: 'Top ventas' },
    { emoji: '✨', label: 'Recomendado para ti' },
    { emoji: '🚀', label: 'Lo más buscado' }
  ];

  function pickRandomHook(excludeLabel) {
    const options = pickHooks.filter((hook) => hook.label !== excludeLabel);
    return options[Math.floor(Math.random() * options.length)];
  }

  function initWeeklyPickToast() {
    const first = pickRandomProduct();
    if (!first) return;

    const toast = document.createElement('a');
    toast.className = 'weekly-pick-toast';

    const icon = document.createElement('span');
    icon.className = 'weekly-pick-toast__icon';

    const textWrap = document.createElement('span');
    textWrap.className = 'weekly-pick-toast__text';

    const label = document.createElement('strong');
    const productName = document.createElement('span');

    textWrap.appendChild(label);
    textWrap.appendChild(productName);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'weekly-pick-toast__close';
    closeBtn.setAttribute('aria-label', 'Cerrar');
    closeBtn.textContent = '×';

    toast.appendChild(icon);
    toast.appendChild(textWrap);
    toast.appendChild(closeBtn);
    document.body.appendChild(toast);

    function positionBelowHeader() {
      const header = document.querySelector('sticky-header, .header-wrapper');
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      toast.style.top = Math.max(headerBottom, 0) + 90 + 'px';
    }

    positionBelowHeader();
    window.addEventListener('resize', positionBelowHeader);
    window.addEventListener('scroll', positionBelowHeader, { passive: true });

    let currentProduct = first;
    let currentHook = pickRandomHook();
    let rotateTimer = null;

    function render(product, hook) {
      toast.href = product.url;
      icon.textContent = hook.emoji;
      label.textContent = hook.label;
      productName.textContent = product.name;
    }

    render(currentProduct, currentHook);
    requestAnimationFrame(() => toast.classList.add('show'));

    let stopped = false;

    function cycle() {
      toast.classList.remove('show');

      rotateTimer = setTimeout(() => {
        if (stopped) return;

        const nextProduct = pickRandomProduct(currentProduct.url);
        if (nextProduct) {
          currentProduct = nextProduct;
          currentHook = pickRandomHook(currentHook.label);
          render(currentProduct, currentHook);
        }

        requestAnimationFrame(() => toast.classList.add('show'));
        rotateTimer = setTimeout(cycle, 4000);
      }, 10000);
    }

    rotateTimer = setTimeout(cycle, 4000);

    closeBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      stopped = true;
      clearTimeout(rotateTimer);
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 350);
    });
  }

  setTimeout(initWeeklyPickToast, 800);

  const sliders = document.querySelectorAll('[id^="Slider-"]');
  if (!sliders.length) return;

  function isUserBusy() {
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return true;
    if (document.querySelector('details[open]')) return true;

    const predictiveSearch = document.querySelector('predictive-search');
    if (predictiveSearch && predictiveSearch.isOpen) return true;

    return false;
  }

  sliders.forEach((slider, index) => {
    function getMaxScroll() {
      return slider.scrollWidth - slider.clientWidth;
    }

    const direction = index % 2 === 0 ? 1 : -1;
    let position = direction === 1 ? 0 : getMaxScroll();
    let paused = false;

    const observer = new IntersectionObserver(
      (entries) => {
        paused = !entries[0].isIntersecting;
      },
      { threshold: 0.2 }
    );
    observer.observe(slider);

    slider.addEventListener('pointerenter', () => {
      paused = true;
    });
    slider.addEventListener('pointerleave', () => {
      paused = false;
    });

    const intervalTime = 2800 + index * 350;

    setInterval(() => {
      if (paused || isUserBusy()) return;

      const maxScroll = getMaxScroll();
      if (maxScroll <= 0) return;

      position += 200 * direction;

      if (direction === 1 && position >= maxScroll) position = 0;
      if (direction === -1 && position <= 0) position = maxScroll;

      slider.scrollTo({ left: position, behavior: 'smooth' });
    }, intervalTime);
  });
});
