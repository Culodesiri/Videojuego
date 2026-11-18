// A single action a fighter can perform. Plain data holder built from JSON.
export class Skill {
  constructor(id, data) {
    this.id = id;
    Object.assign(this, { power: 0, cost: 0, acc: 100, effect: null, selfDamage: 0 }, data);
  }
}
