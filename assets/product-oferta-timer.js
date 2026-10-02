function hashProductId(idAttr) {
  try {
    const id = BigInt(idAttr || '0');
    const hash = (id * 2654435761n) % 2147483647n;
    return Number(hash < 0n ? hash + 2147483647n : hash);
  } catch (e) {
    return 0;
  }
}

document.querySelectorAll('[data-oferta-timer]').forEach((el) => {
  const hoursEl = el.querySelector('[data-unit="hours"]');
  const minutesEl = el.querySelector('[data-unit="minutes"]');
  const secondsEl = el.querySelector('[data-unit="seconds"]');
  const seed = hashProductId(el.getAttribute('data-product-id'));

  const endHour = 18 + (seed % 6);
  const endMinute = Math.floor(seed / 6) % 60;

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function getEndTime() {
    const end = new Date();
    end.setHours(endHour, endMinute, 0, 0);
    if (end.getTime() <= Date.now()) {
      end.setDate(end.getDate() + 1);
    }
    return end;
  }

  let target = getEndTime();

  function tick() {
    const now = Date.now();
    let diff = target.getTime() - now;

    if (diff <= 0) {
      target = getEndTime();
      diff = target.getTime() - now;
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
