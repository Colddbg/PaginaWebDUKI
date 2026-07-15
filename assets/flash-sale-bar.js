document.querySelectorAll('[data-flash-sale-bar]').forEach((bar) => {
  const timer = bar.querySelector('[data-flash-sale-timer]');
  if (!timer) return;

  const hoursEl = timer.querySelector('[data-unit="hours"]');
  const minutesEl = timer.querySelector('[data-unit="minutes"]');
  const secondsEl = timer.querySelector('[data-unit="seconds"]');

  const fixedEndDate = bar.getAttribute('data-end-date');

  function getEndTime() {
    if (fixedEndDate) {
      const parsed = new Date(fixedEndDate);
      if (!isNaN(parsed.getTime())) return { date: parsed, fixed: true };
    }
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { date: end, fixed: false };
  }

  let target = getEndTime();

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function tick() {
    const now = new Date();
    let diff = target.date.getTime() - now.getTime();

    if (diff <= 0) {
      if (target.fixed) {
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';
        return;
      }
      target = getEndTime();
      diff = target.date.getTime() - now.getTime();
    }

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  }

  tick();
  setInterval(tick, 1000);
});
