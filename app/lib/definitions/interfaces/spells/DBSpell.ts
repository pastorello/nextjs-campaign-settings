interface DBSpell {
  name: string;
  id: number;
  level: number;
  circle: number[];
  classes: number[];
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  savingThrow: string;
  ritual: boolean;
  concentration: boolean;
  description: string;
  upcast: string;
}

export default DBSpell;
