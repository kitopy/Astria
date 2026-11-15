import './dialog.css';

// Shared modal dialog for every screen (workshop, flight, investigation...).
// Uses the native <dialog> element: it covers the whole window whatever its size,
// keeps keyboard focus inside and blocks clicks on the game until it closes.
//
//   const choice = await showDialog(scene, {
//     title: 'Elegí qué pieza llevar',
//     text: 'En cada paso vas a elegir entre dos opciones.',
//     actions: [{ label: 'Más tarde', value: 'later' }, { label: '¡Entendido!', value: 'ok', primary: true }],
//   });
//
// Resolves with the value of the button pressed, or null if closed with Escape
// or because the scene ended. With no actions, a single "¡Entendido!" button is shown.
// body: optional extra HTML under the text (only markup written in the game's code, never user text).
// dismissable: false when the player must pick one of the buttons (Escape does nothing).
export function showDialog(scene, { title, text = '', body = '', dismissable = true, autoCloseMs = 0, showCountdown = true, actions = [{ label: '¡Entendido!', value: 'ok', primary: true }] }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'astrion-dialog';
  dialog.innerHTML = `
    <h2></h2>
    ${text ? '<p></p>' : ''}
    ${body}
    <div class="astrion-dialog-actions">
      ${actions.map((a, i) => `<button type="button" data-index="${i}" class="${a.primary ? 'primary' : ''}"></button>`).join('')}
    </div>`;
  // textContent, not innerHTML, so texts never break the markup.
  dialog.querySelector('h2').textContent = title;
  if (text) dialog.querySelector('p').textContent = text;
  dialog.querySelectorAll('button').forEach((button, i) => (button.textContent = actions[i].label));
  document.body.append(dialog);

  // Timed acknowledgements resolve like their first action; questions never time out by default.
  const timed = Number.isFinite(autoCloseMs) && autoCloseMs > 0;
  if (timed && showCountdown) {
    const countdown = document.createElement('div');
    countdown.className = 'astrion-dialog-countdown';
    countdown.innerHTML = '<span></span><div aria-hidden="true"><i></i></div>';
    countdown.querySelector('span').textContent = `Continúa en ${Math.ceil(autoCloseMs / 1000)} s`;
    dialog.style.setProperty('--dialog-countdown-duration', `${autoCloseMs}ms`);
    dialog.querySelector('.astrion-dialog-actions').before(countdown);
  }

  return new Promise((resolve) => {
    let result = null;
    let done = false;
    let timeout;
    let countdownInterval;

    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      clearInterval(countdownInterval);
      scene.events.off('shutdown', onShutdown);
      dialog.remove();
      resolve(result);
    };
    let closing = false;
    const close = (value) => {
      if (!dialog.open || closing) return;
      clearTimeout(timeout);
      clearInterval(countdownInterval);
      closing = true;
      result = value;
      dialog.classList.add('is-leaving');
      setTimeout(() => {
        dialog.close();
        finish();
      }, 260);
    };
    const onShutdown = () => {
      closing = true;
      if (dialog.open) dialog.close();
      finish();
    };

    dialog.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-index]');
      if (button) close(actions[Number(button.dataset.index)].value);
    });
    // Escape: animate out like a normal close instead of disappearing at once.
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      if (dismissable) close(null);
    });
    // The browser can force a modal dialog closed (Chrome does it after Escape is pressed twice, even when
    // 'cancel' is prevented). A dialog that needs a choice opens again; any other one counts as Escape.
    dialog.addEventListener('close', () => {
      if (closing || done) return;
      if (dismissable) finish();
      else dialog.showModal();
    });
    scene.events.once('shutdown', onShutdown);

    dialog.showModal();
    if (timed) {
      const deadline = Date.now() + autoCloseMs;
      if (showCountdown) {
        countdownInterval = setInterval(() => {
          dialog.querySelector('.astrion-dialog-countdown span').textContent = `Continúa en ${Math.max(0, Math.ceil((deadline - Date.now()) / 1000))} s`;
        }, 100);
      }
      timeout = setTimeout(() => close(actions[0]?.value ?? null), autoCloseMs);
    }
    (dialog.querySelector('button.primary') ?? dialog.querySelector('button')).focus({ preventScroll: true });
  });
}
