/**
 * Xmorf Anti-Bot Verification Slider & Verification Challenge
 */
class AntiBotSecurity {
  constructor(containerId, onVerifiedCallback) {
    this.container = document.getElementById(containerId);
    this.onVerified = onVerifiedCallback;
    this.isVerified = false;
    this.isDragging = false;
    this.startX = 0;
    this.currentX = 0;
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="antibot-wrapper">
        <div class="antibot-header">
          <div class="antibot-shield-icon">${window.XmorfIcons.shield}</div>
          <span data-i18n="antibotLabel">${window.i18n.get('antibotLabel')}</span>
          <span class="antibot-badge">Xmorf Shield v4</span>
        </div>
        <div class="antibot-track">
          <div class="antibot-fill"></div>
          <div class="antibot-text" data-i18n="antibotInstruction">${window.i18n.get('antibotInstruction')}</div>
          <div class="antibot-slider-handle">
            <span class="handle-icon">${window.XmorfIcons.arrowRight}</span>
          </div>
        </div>
      </div>
    `;

    this.track = this.container.querySelector('.antibot-track');
    this.fill = this.container.querySelector('.antibot-fill');
    this.text = this.container.querySelector('.antibot-text');
    this.handle = this.container.querySelector('.antibot-slider-handle');

    this.bindEvents();
  }

  reset() {
    this.isVerified = false;
    if (this.fill) this.fill.style.width = '0%';
    if (this.handle) {
      this.handle.style.left = '0px';
      this.handle.innerHTML = `<span class="handle-icon">${window.XmorfIcons.arrowRight}</span>`;
      this.handle.classList.remove('verified');
    }
    if (this.track) this.track.classList.remove('verified');
    if (this.text) {
      this.text.textContent = window.i18n.get('antibotInstruction');
      this.text.setAttribute('data-i18n', 'antibotInstruction');
      this.text.style.opacity = '1';
    }
  }

  bindEvents() {
    if (!this.handle || !this.track) return;

    const onStart = (e) => {
      if (this.isVerified) return;
      this.isDragging = true;
      this.startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      document.addEventListener('mousemove', onMove);
      document.addEventListener('touchmove', onMove);
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchend', onEnd);
    };

    const onMove = (e) => {
      if (!this.isDragging || this.isVerified) return;
      if (e.type.includes('touch')) {
        e.preventDefault();
      }
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const trackWidth = this.track.offsetWidth || 300;
      const handleWidth = this.handle.offsetWidth || 40;
      const maxDistance = trackWidth - handleWidth;

      if (maxDistance <= 0) return;

      let moveX = clientX - this.startX;
      if (moveX < 0) moveX = 0;
      if (moveX > maxDistance) moveX = maxDistance;

      this.handle.style.left = `${moveX}px`;
      this.fill.style.width = `${moveX + handleWidth / 2}px`;
      this.text.style.opacity = `${1 - moveX / maxDistance}`;

      if (moveX >= maxDistance - 2) {
        this.completeVerification();
      }
    };

    const onEnd = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchend', onEnd);

      if (!this.isVerified) {
        this.handle.style.left = '0px';
        this.fill.style.width = '0%';
        this.text.style.opacity = '1';
      }
    };

    this.handle.addEventListener('mousedown', onStart);
    this.handle.addEventListener('touchstart', onStart);
  }

  completeVerification() {
    this.isVerified = true;
    this.isDragging = false;
    this.handle.classList.add('verified');
    this.track.classList.add('verified');
    this.handle.innerHTML = window.XmorfIcons.check;
    this.fill.style.width = '100%';
    this.text.textContent = window.i18n.get('antibotSuccess');
    this.text.setAttribute('data-i18n', 'antibotSuccess');
    this.text.style.opacity = '1';

    if (typeof this.onVerified === 'function') {
      this.onVerified({
        success: true,
        token: 'xmorf_bot_shield_' + Math.random().toString(36).substring(2)
      });
    }
  }
}

window.AntiBotSecurity = AntiBotSecurity;
