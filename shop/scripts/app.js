import { License } from './types/license.js';
import { LicenseController } from './controllers/licenseController.js';

// Loads the data and decides where and in which order each section is rendered.
class App {
  constructor() {
    this.main = document.getElementById('main');
    this.navigation = document.getElementById('navigation');
    this.controller = null;
  }

  async Initialize() {
    try {
      this.controller = new LicenseController(await this.LoadLicenses());
      this.RenderSections();
    } catch (error) {
      console.error(error);
      this.main.innerHTML = '<p class="error">No se pudieron cargar las licencias.</p>';
    }
  }

  async LoadLicenses() {
    const response = await fetch('data/licenses.json');
    const data = await response.json();
    return data.map((item) => new License(
      item.id, item.software, item.version, item.price, item.key, item.featured, item.discount
    ));
  }

  // The order of this list is the order of the sections on the page.
  RenderSections() {
    const sections = [
      { id: 'featured', title: 'Destacados', render: (parent) => this.controller.RenderFeatured(4, parent) },
      { id: 'offers', title: 'Ofertas', render: (parent) => this.controller.RenderOffers(4, parent) },
      { id: 'latest', title: 'Últimas versiones', render: (parent) => this.controller.RenderLatest(1, parent) },
      { id: 'all', title: 'Todas las licencias', render: (parent) => this.controller.RenderAll(12, parent) }
    ];
    sections.forEach((section) => this.RenderSection(section));
  }

  RenderSection({ id, title, render }) {
    const section = document.createElement('section');
    section.id = id;
    section.innerHTML = `<h2>${title}</h2><div class="grid"></div>`;
    this.main.appendChild(section);
    render(section.querySelector('.grid'));

    const link = document.createElement('a');
    link.href = `#${id}`;
    link.textContent = title;
    this.navigation.appendChild(link);
  }
}

new App().Initialize();
