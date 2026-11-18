// Everything that touches the DOM during menus and battles.
export class UIManager {
  constructor() {
    this.screens = document.querySelectorAll('.screen');
    document.addEventListener('keydown', (e) => {
      document.querySelectorAll('#skills .skill')[Number(e.key) - 1]?.click();
    });
  }

  $(id) { return document.getElementById(id); }

  show(name) {
    this.screens.forEach((s) => s.classList.toggle('active', s.id === `screen-${name}`));
  }

  renderRoster(characters, onPick) {
    const holder = this.$('roster');
    holder.innerHTML = '';
    characters.forEach((c) => {
      const card = document.createElement('button');
      card.className = 'card';
      card.innerHTML = `<div class="portrait"></div><h3>${c.name}</h3>
        <p>Vida ${c.stats.hp} · Ataque ${c.stats.attack}<br>Defensa ${c.stats.defense} · Velocidad ${c.stats.speed}</p>`;
      this.renderPortrait(card.querySelector('.portrait'), c);
      card.addEventListener('click', () => onPick(c));
      holder.appendChild(card);
    });
  }

  // Shows the character image; the kanji on a color gradient stays as fallback if the file is missing.
  renderPortrait(element, character) {
    element.style.background = `linear-gradient(135deg,${character.colors[0]},${character.colors[1]})`;
    element.textContent = character.symbol;
    if (!character.image) return;
    const image = new Image();
    image.alt = character.name;
    image.onload = () => { element.textContent = ''; element.appendChild(image); };
    image.src = character.image;
  }

  // Tournament path: the player, every rival in order (done / current / pending) and the trophy.
  renderBracket(player, opponents, current) {
    const holder = this.$('bracket');
    holder.innerHTML = '';
    const labels = { player: 'Tu shinobi', done: 'Vencido', current: '¡Ahora!', pending: 'Pendiente' };
    const entries = [{ character: player, state: 'player' }, ...opponents.map((character, i) => ({
      character, state: i < current ? 'done' : i === current ? 'current' : 'pending'
    }))];
    entries.forEach(({ character, state }) => {
      const node = document.createElement('div');
      node.className = `node ${state}`;
      node.innerHTML = `<div class="portrait"></div><strong>${character.name}</strong><small>${labels[state]}</small>`;
      this.renderPortrait(node.querySelector('.portrait'), character);
      holder.appendChild(node);
    });
    const trophy = document.createElement('div');
    trophy.className = 'node trophy';
    trophy.innerHTML = '<div class="portrait">🏆</div><strong>Campeón</strong>';
    holder.appendChild(trophy);
    this.$('bracket-info').textContent = `Combate ${current + 1} de ${opponents.length}: te enfrentas a ${opponents[current].name}`;
  }

  setupBattle(player, enemy, index, total) {
    this.$('fight-label').textContent = `Combate ${index + 1} de ${total}`;
    this.$('log').innerHTML = '';
    [['player', player], ['enemy', enemy]].forEach(([side, fighter]) => {
      this.$(`${side}-name`).textContent = fighter.name;
      this.renderPortrait(this.$(`${side}-portrait`), fighter);
      this.$(`${side}-panel`).classList.remove('faint');
    });
  }

  updateState(state) {
    for (const side of ['player', 'enemy']) {
      const s = state[side];
      this.$(`${side}-panel`).classList.toggle('faint', s.hp === 0);
      this.$(`${side}-hp`).style.width = `${(100 * s.hp) / s.maxHp}%`;
      this.$(`${side}-hp-text`).textContent = `Vida ${s.hp} / ${s.maxHp}`;
      this.$(`${side}-chakra`).style.width = `${(100 * s.chakra) / s.maxChakra}%`;
      this.$(`${side}-chakra-text`).textContent = `Chakra ${s.chakra} / ${s.maxChakra}`;
      const icons = s.buffs.map((b) => (b === 'attack' ? '⚔️↑' : '🛡️↑'));
      if (s.burning) icons.push('🔥');
      if (s.stunned) icons.push('💫');
      this.$(`${side}-status`).textContent = icons.join(' ');
    }
  }

  renderSkills(skills, chakra, onChoose) {
    const holder = this.$('skills');
    holder.innerHTML = '';
    skills.forEach((skill, i) => {
      const button = document.createElement('button');
      button.className = 'skill';
      button.disabled = chakra < skill.cost;
      button.innerHTML = `<strong>${i + 1}. ${skill.name}</strong><small>${skill.cost ? `${skill.cost} chakra` : 'Gratis'} · ${skill.desc}</small>`;
      button.addEventListener('click', () => onChoose(skill));
      holder.appendChild(button);
    });
  }

  async playEvents(events, audio) {
    for (const event of events) {
      this.addLog(this.describe(event));
      this.updateState(event.state);
      this.animate(event, audio);
      await new Promise((resolve) => setTimeout(resolve, event.type === 'roundEnd' ? 150 : 650));
    }
  }

  animate(event, audio) {
    const panel = this.$(`${event.side}-panel`);
    const flash = (cls) => { panel.classList.add(cls); setTimeout(() => panel.classList.remove(cls), 400); };
    if (event.type === 'use' && event.skill.type === 'damage') flash('attack');
    if (event.type === 'damage') { flash('hit'); this.floatText(panel, `-${event.amount}${event.crit ? '!' : ''}`, 'dmg'); audio.play(event.crit ? 'crit' : 'hit'); }
    if (event.type === 'miss') { this.floatText(panel, 'Esquiva', 'miss'); audio.play('miss'); }
    if (event.type === 'heal') { this.floatText(panel, `+${event.amount}`, 'heal'); audio.play('heal'); }
    if (event.type === 'burn' || event.type === 'recoil') this.floatText(panel, `-${event.amount}`, 'dmg');
  }

  floatText(panel, text, cls) {
    const span = document.createElement('span');
    span.className = `float ${cls}`;
    span.textContent = text;
    panel.appendChild(span);
    setTimeout(() => span.remove(), 900);
  }

  describe(e) {
    switch (e.type) {
      case 'use': return `${e.name} usa ${e.skill.name}.`;
      case 'damage': return `${e.name} recibe ${e.amount} de daño${e.crit ? ' (¡crítico!)' : ''}.`;
      case 'miss': return `¡El ataque falla contra ${e.name}!`;
      case 'heal': return `${e.name} recupera ${e.amount} de vida.`;
      case 'buff': return `${e.name} potencia su ${e.stat === 'attack' ? 'ataque' : 'defensa'}.`;
      case 'status': return e.status === 'stun' ? `${e.name} queda aturdido.` : `${e.name} empieza a arder.`;
      case 'stunned': return `${e.name} está aturdido y pierde el turno.`;
      case 'burn': return `${e.name} sufre ${e.amount} de daño por quemaduras.`;
      case 'recoil': return `${e.name} sufre ${e.amount} de daño por el esfuerzo.`;
      default: return null;
    }
  }

  addLog(text) {
    if (!text) return;
    const log = this.$('log');
    const line = document.createElement('p');
    line.textContent = text;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  }

  showResult(victory, stats, name) {
    const seconds = Math.round((Date.now() - stats.startedAt) / 1000);
    this.$('result-title').textContent = victory ? '¡Victoria!' : 'Derrota';
    this.$('result-text').textContent = `${name} ${victory ? 'se proclama campeón del torneo' : 'cae en combate'}. Rondas: ${stats.rounds} · Daño causado: ${stats.damage} · Tiempo: ${seconds} s`;
    this.show('result');
  }
}
