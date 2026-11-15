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
export function showDialog(scene, { title, text = '', body = '', actions = [{ label: '¡Entendido!', value: 'ok', primary: true }] }) {
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

  return new Promise((resolve) => {
    let result = null;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      scene.events.off('shutdown', onShutdown);
      dialog.remove();
      resolve(result);
    };
    const close = (value) => {
      if (!dialog.open) return;
      result = value;
      dialog.classList.add('is-leaving');
      setTimeout(() => {
        dialog.close();
        finish();
      }, 260);
    };
    const onShutdown = () => {
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
      close(null);
    });
    scene.events.once('shutdown', onShutdown);

    dialog.showModal();
    (dialog.querySelector('button.primary') ?? dialog.querySelector('button')).focus({ preventScroll: true });
  });
}
