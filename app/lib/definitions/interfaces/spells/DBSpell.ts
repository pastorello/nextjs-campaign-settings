interface DBSpell {
  nome: string;
  id: number;
  livello: number;
  circolo: number[];
  classi: number[];
  sottoclassi: number[];
  tempodilancio: string;
  gittata: string;
  componenti: string;
  durata: string;
  tirosalvezza: string;
  rituale: boolean;
  concentrazione: boolean;
  descrizione: string;
  intensificato: string;
}

export default DBSpell;
