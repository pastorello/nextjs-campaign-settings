import PngMetaField from "../../enums/png/PngMetaField";

interface PngItem {
  id: number;
  [PngMetaField.nome]: string;
  [PngMetaField.descrizione]: string;
  [PngMetaField.titolo]: string;
  [PngMetaField.allineamento]: number;
  [PngMetaField.dominioAllineamento]: number;
  [PngMetaField.mansione]: string;
  [PngMetaField.luogo]: number;
  [PngMetaField.fazione]: number;
  [PngMetaField.aspetto]: string;
  [PngMetaField.personalita]: string;
  [PngMetaField.motivazioni]: string;
  [PngMetaField.segreti]: string;
}

export default PngItem;
