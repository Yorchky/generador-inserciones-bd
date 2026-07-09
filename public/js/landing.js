/* ============================================================================
   SMART DATA GENERATOR — js.js (con menú 3D mejorado)
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* --------------------------------------------------------------------
     1. NAVEGACIÓN CON NUEVO MENÚ 3D
  -------------------------------------------------------------------- */
  const menu = document.getElementById('menu');
  const infoBtn = document.getElementById('info-btn');
  const loginBtn = document.getElementById('login-btn');
  const aboutBtn = document.getElementById('about-btn');

  const pages = document.querySelectorAll('.page');

  function goToPage(pageId) {
    menu.dataset.active = pageId;

    // Actualizar clases activo/inactivo
    infoBtn.className  = 'boton ' + (pageId === 'info'  ? 'activo' : 'inactivo');
    loginBtn.className = 'boton ' + (pageId === 'login' ? 'activo' : 'inactivo');
    aboutBtn.className = 'boton ' + (pageId === 'about' ? 'activo' : 'inactivo');

    // Mostrar página correspondiente
    pages.forEach((page) => {
      page.classList.toggle('is-active', page.id === `page-${pageId}`);
    });
  }

  infoBtn.addEventListener('click', () => goToPage('info'));
  loginBtn.addEventListener('click', () => goToPage('login'));
  aboutBtn.addEventListener('click', () => goToPage('about'));

  /* --------------------------------------------------------------------
     2. TOGGLE LOGIN <-> SIGN UP
  -------------------------------------------------------------------- */
  const switchButtons = document.querySelectorAll('.auth-switch__btn');
  const authCards = document.querySelectorAll('.auth-card');

  switchButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      authCards.forEach((card) => {
        card.classList.toggle('is-active', card.id === targetId);
      });
    });
  });

  /* --------------------------------------------------------------------
     3. FORMULARIOS
  -------------------------------------------------------------------- */
  const formLogin = document.getElementById('form-login');
  const formSignup = document.getElementById('form-signup');

  if (formLogin) {
    formLogin.addEventListener('submit', (event) => {
      event.preventDefault();
      const username = formLogin.querySelector('[name="username"]').value.trim();
      const password = formLogin.querySelector('[name="password"]').value.trim();
      if (username === 'Christopher' && password === '123') {
        window.location.href = 'main.html';
      } else {
        alert('Credenciales incorrectas. Usuario: Christopher · Contraseña: 123');
      }
    });
  }

  if (formSignup) {
    formSignup.addEventListener('submit', (event) => {
      event.preventDefault();
      console.log('Signup submit -> pendiente de conectar con backend');
    });
  }

});