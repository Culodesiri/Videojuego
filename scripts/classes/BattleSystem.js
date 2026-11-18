// Pure battle rules. Each round returns an ordered list of events (with state snapshots)
// so the UI can replay them step by step without knowing any rule.
export class BattleSystem {
  constructor(player, enemy, ai, rng = Math.random) {
    this.player = player;
    this.enemy = enemy;
    this.ai = ai;
    this.rng = rng;
    this.round = 0;
    this.damageDealt = 0;
  }

  get state() { return { player: this.player.snapshot(), enemy: this.enemy.snapshot() }; }

  executeRound(playerSkill) {
    this.round++;
    const events = [];
    const enemySkill = this.ai.chooseSkill(this.enemy, this.player);
    const turns = [[this.player, this.enemy, playerSkill], [this.enemy, this.player, enemySkill]];
    if (this.enemy.stat('speed') > this.player.stat('speed')) turns.reverse();

    for (const [actor, target, skill] of turns) {
      this.performTurn(actor, target, skill, events);
      if (!actor.alive || !target.alive) return this.finish(events);
    }
    for (const fighter of [this.player, this.enemy]) {
      this.endOfRound(fighter, events);
      if (!fighter.alive) break;
    }
    return this.finish(events);
  }

  performTurn(actor, target, skill, events) {
    actor.guarding = false;
    if (actor.stunned) {
      actor.stunned = false;
      actor.stunResist = 2;
      this.log(events, 'stunned', actor);
      return;
    }
    actor.chakra -= skill.cost;
    this.log(events, 'use', actor, { skill });

    if (skill.type === 'guard') { actor.guarding = true; actor.gainChakra(10); }
    if (skill.type === 'focus') actor.gainChakra(35);
    if (skill.type === 'heal') {
      const before = actor.hp;
      actor.heal(skill.power);
      this.log(events, 'heal', actor, { amount: actor.hp - before });
    }
    if (skill.type === 'buff') {
      const fx = skill.effect;
      actor.addBuff(fx.stat, fx.amount, fx.turns);
      this.log(events, 'buff', actor, { stat: fx.stat });
    }
    if (skill.type === 'damage') this.attack(actor, target, skill, events);
    if (skill.selfDamage) {
      const amount = Math.min(skill.selfDamage, actor.hp - 1);
      actor.takeDamage(amount);
      this.log(events, 'recoil', actor, { amount });
    }
  }

  attack(actor, target, skill, events) {
    if (this.rng() * 100 >= skill.acc) { this.log(events, 'miss', target); return; }

    let damage = skill.power * (actor.stat('attack') / target.stat('defense')) * (0.9 + this.rng() * 0.2);
    const crit = this.rng() < 0.1;
    if (crit) damage *= 1.5;
    if (target.guarding) damage *= 0.4;
    damage = Math.max(1, Math.round(damage));

    target.takeDamage(damage);
    if (actor === this.player) this.damageDealt += damage;
    this.log(events, 'damage', target, { amount: damage, crit });

    const fx = skill.effect;
    if (!fx || !target.alive) return;
    if (fx.kind === 'stun' && this.rng() < fx.chance && !target.stunned && target.stunResist === 0) {
      target.stunned = true;
      this.log(events, 'status', target, { status: 'stun' });
    }
    if (fx.kind === 'burn') {
      target.burn = { turns: fx.turns, damage: fx.damage };
      this.log(events, 'status', target, { status: 'burn' });
    }
  }

  endOfRound(fighter, events) {
    if (fighter.burn) {
      fighter.takeDamage(fighter.burn.damage);
      this.log(events, 'burn', fighter, { amount: fighter.burn.damage });
      if (--fighter.burn.turns <= 0) fighter.burn = null;
    }
    fighter.tickBuffs();
    fighter.gainChakra(8);
    if (fighter.stunResist > 0) fighter.stunResist--;
  }

  finish(events) {
    this.log(events, 'roundEnd', this.player);
    const winner = !this.enemy.alive ? 'player' : !this.player.alive ? 'enemy' : null;
    return { events, winner };
  }

  log(events, type, actor, extra = {}) {
    events.push({ type, side: actor === this.player ? 'player' : 'enemy', name: actor.name, ...extra, state: this.state });
  }
}
