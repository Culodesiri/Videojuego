import { Fighter } from './Fighter.js';
import { BattleSystem } from './BattleSystem.js';
import { EnemyAI } from './EnemyAI.js';
import { UIManager } from './UIManager.js';
import { DialogueManager } from './DialogueManager.js';
import { AudioManager } from './AudioManager.js';

// Orchestrates the whole run: menu -> story dialogue -> 3 fights -> result.
export class Game {
  constructor() {
    this.ui = new UIManager();
    this.audio = new AudioManager();
    this.dialogue = new DialogueManager(document.getElementById('screen-dialogue'));
    this.data = null;
    this.player = null;
    this.opponents = [];
    this.fightIndex = 0;
    this.battle = null;
    this.busy = false;
    this.stats = {};
  }

  async init() {
    this.data = await (await fetch('./data/game.json')).json();
    this.on('btn-start', () => { this.audio.play('click'); this.openRoster(); });
    this.on('btn-fight', () => { this.audio.play('click'); this.startFight(); });
    this.on('btn-again', () => { this.audio.play('click'); this.openRoster(); });
    this.on('btn-mute', (e) => { e.target.textContent = this.audio.toggleMute() ? '🔇' : '🔊'; });
  }

  on(id, handler) { document.getElementById(id).addEventListener('click', handler); }

  openRoster() {
    this.ui.renderRoster(this.data.characters, (character) => this.startRun(character));
    this.ui.show('roster');
  }

  startRun(chosen) {
    this.audio.play('click');
    this.player = Fighter.fromData(chosen, this.data, 1);
    this.opponents = this.pickOpponents(chosen);
    this.fightIndex = 0;
    this.stats = { rounds: 0, damage: 0, startedAt: Date.now() };
    this.playDialogue(this.data.story.intro, () => this.showBracket());
  }

  // Random rivals (shuffled without bias), ordered from weakest to strongest rank.
  pickOpponents(chosen) {
    return this.data.characters
      .filter((c) => c.id !== chosen.id)
      .map((character) => ({ character, order: Math.random() }))
      .sort((a, b) => a.order - b.order)
      .slice(0, this.data.story.hpScale.length)
      .map((entry) => entry.character)
      .sort((a, b) => a.rank - b.rank);
  }

  playDialogue(lines, onDone) {
    this.ui.show('dialogue');
    this.dialogue.start(lines, onDone);
  }

  showBracket() {
    this.ui.renderBracket(this.player, this.opponents, this.fightIndex);
    this.ui.show('bracket');
  }

  startFight() {
    const opponent = this.opponents[this.fightIndex];
    const enemy = Fighter.fromData(opponent, this.data, this.data.story.hpScale[this.fightIndex]);
    this.battle = new BattleSystem(this.player, enemy, new EnemyAI());
    const lines = [
      { speaker: opponent.name, text: opponent.taunt },
      { speaker: this.player.name, text: this.player.data.reply }
    ];
    this.playDialogue(lines, () => {
      this.ui.show('battle');
      this.ui.setupBattle(this.player, enemy, this.fightIndex, this.opponents.length);
      this.ui.updateState(this.battle.state);
      this.refreshSkills();
    });
  }

  refreshSkills() {
    this.ui.renderSkills(this.player.skills, this.player.chakra, (skill) => this.playRound(skill));
  }

  async playRound(skill) {
    if (this.busy) return;
    this.busy = true;
    this.audio.play('click');
    this.ui.renderSkills(this.player.skills, -1, () => {});
    const { events, winner } = this.battle.executeRound(skill);
    await this.ui.playEvents(events, this.audio);
    this.busy = false;
    if (winner) this.endFight(winner);
    else this.refreshSkills();
  }

  endFight(winner) {
    this.stats.rounds += this.battle.round;
    this.stats.damage += this.battle.damageDealt;
    const story = this.data.story;
    const opponent = this.opponents[this.fightIndex];

    if (winner === 'enemy') {
      this.audio.play('lose');
      this.playDialogue(story.defeat, () => this.ui.showResult(false, this.stats, this.player.name));
      return;
    }
    this.audio.play('win');
    const defeatLine = { speaker: opponent.name, text: opponent.defeat };
    this.fightIndex++;
    if (this.fightIndex >= this.opponents.length) {
      this.playDialogue([defeatLine, ...story.victory], () => this.ui.showResult(true, this.stats, this.player.name));
    } else {
      this.player.recoverBetweenFights();
      this.playDialogue([defeatLine, ...story.between], () => this.showBracket());
    }
  }
}
