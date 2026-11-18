// Simple rule-based decision making, shared by any fighter that is not human-controlled.
export class EnemyAI {
  constructor(rng = Math.random) { this.rng = rng; }

  chooseSkill(self) {
    const usable = self.skills.filter((s) => self.canUse(s));
    const pick = (type) => usable.find((s) => s.type === type);

    if (pick('heal') && self.hp < self.maxHp * 0.35 && this.rng() < 0.8) return pick('heal');

    const buff = usable.find((s) => s.type === 'buff' && !self.buffs.some((b) => b.stat === s.effect.stat));
    if (buff && this.rng() < 0.5) return buff;

    const attacks = usable.filter((s) => s.type === 'damage').sort((a, b) => b.power - a.power);
    if (attacks[0].cost > 0 && this.rng() < 0.75) return attacks[0];
    if (self.chakra < 30 && this.rng() < 0.6) return pick('focus');
    if (this.rng() < 0.12) return pick('guard');
    return attacks[attacks.length - 1];
  }
}
