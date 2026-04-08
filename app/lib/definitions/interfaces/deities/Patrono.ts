import Festivita from "@/app/lib/definitions/enums/deities/Festivita";
import SignificatoTarocco from "@/app/lib/definitions/enums/tarocchi/SignificatoTarocco";

import PatronoMetaField from "../../enums/deities/PatronoMetaField";

interface Patrono {
  id: number;
  [PatronoMetaField.nome]: string;
  [PatronoMetaField.titoloPatrono]: string;
  [PatronoMetaField.tipoPatrono]: number;
  [PatronoMetaField.gradoPatrono]: number;
  [PatronoMetaField.card]: number;
  [PatronoMetaField.astri]: number;
  [PatronoMetaField.elemento]: number;
  [PatronoMetaField.classe]: number;
  [PatronoMetaField.festivita]: Festivita;
  [PatronoMetaField.colore]: number;
  [PatronoMetaField.tradizione]: number;
  [PatronoMetaField.allineamento]: number;
  [PatronoMetaField.dominioAllineamento]: number;
  [PatronoMetaField.residenza]: number;
  [PatronoMetaField.luogo]: number;
  [PatronoMetaField.significato]: SignificatoTarocco;
}

export default Patrono;
