import { Skill } from './Skill.js';

// Combat state of one character: life, chakra, buffs and status effects.
export class Fighter {
  constructor(data, skills, hpScale = 1) {
    this.data = data;
    this.name = data.name;
    this.symbol = data.symbol;
    this.image = data.image;
    this.colors = data.colors;
    this.skills = skills;
    this.maxHp = Math.round(data.stats.hp * hpScale);
    this.maxChakra = data.stats.chakra;
    this.base = { attack: data.stats.attack, defense: data.stats.defense, speed: data.stats.speed };
    this.resetState();
  }

  static fromData(data, game, hpScale = 1) {
    const skills = [...data.skills, ...game.common].map((id) => new Skill(id, game.skills[id]));
    return new Fighter(data, skills, hpScale);
  }

  resetState() {
    this.hp = this.maxHp;
    this.chakra = this.maxChakra;
    this.clearStatus();
  }

  clearStatus() {
    this.buffs = [];
    this.burn = null;
    this.stunned = false;
    this.stunResist = 0;
    this.guarding = false;
  }

  get alive() { return this.hp > 0; }

  stat(name) {
    const bonus = this.buffs.filter((b) => b.stat === name).reduce((sum, b) => sum + b.amount, 0);
    return this.base[name] * (1 + bonus);
  }

  canUse(skill) { return this.chakra >= skill.cost; }
  takeDamage(amount) { this.hp = Math.max(0, this.hp - amount); }
  heal(amount) { this.hp = Math.min(this.maxHp, this.hp + amount); }
  gainChakra(amount) { this.chakra = Math.min(this.maxChakra, this.chakra + amount); }
  addBuff(stat, amount, turns) { this.buffs.push({ stat, amount, turns }); }

  tickBuffs() {
    this.buffs.forEach((b) => b.turns--);
    this.buffs = this.buffs.filter((b) => b.turns > 0);
  }

  recoverBetweenFights() {
    this.heal(Math.round(this.maxHp * 0.8));
    this.chakra = this.maxChakra;
    this.clearStatus();
  }

  snapshot() {
    return {
      hp: this.hp, maxHp: this.maxHp, chakra: this.chakra, maxChakra: this.maxChakra,
      buffs: this.buffs.map((b) => b.stat), burning: !!this.burn, stunned: this.stunned
    };
  }
}
