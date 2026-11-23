const currencyFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

// A software license that can be displayed as a card and bought.
export class License {
  constructor(id, software, version, price, key, featured, discount) {
    this.id = id;
    this.software = software;
    this.version = version;
    this.price = price;
    this.key = key;
    this.featured = featured;
    this.discount = discount;
  }

  get hasDiscount() { return this.discount > 0; }
  get finalPrice() { return this.price * (1 - this.discount / 100); }

  Render(parent) {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      ${this.featured ? '<span class="badge featured">★ Destacado</span>' : ''}
      ${this.hasDiscount ? `<span class="badge discount">-${this.discount}%</span>` : ''}
      <h3>${this.software}</h3>
      <p class="version">Versión ${this.version}</p>
      <p class="prices">
        ${this.hasDiscount ? `<s>${currencyFormatter.format(this.price)}</s>` : ''}
        <strong>${currencyFormatter.format(this.finalPrice)}</strong>
      </p>
      <button class="buy-button">Comprar</button>`;
    card.querySelector('.buy-button').addEventListener('click', () => this.Buy());
    parent.appendChild(card);
    return card;
  }

  // Shows the license key in a small modal window.
  Buy() {
    const dialog = document.createElement('dialog');
    dialog.className = 'key-dialog';
    dialog.innerHTML = `
      <h3>¡Compra realizada!</h3>
      <p>${this.software} ${this.version}</p>
      <code>${this.key}</code>
      <div class="dialog-actions">
        <button class="copy-button">Copiar clave</button>
        <button class="close-button">Cerrar</button>
      </div>`;
    dialog.querySelector('.copy-button').addEventListener('click', (event) => {
      navigator.clipboard?.writeText(this.key);
      event.target.textContent = '¡Copiada!';
    });
    dialog.querySelector('.close-button').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => dialog.remove());
    document.body.appendChild(dialog);
    dialog.showModal();
  }
}
