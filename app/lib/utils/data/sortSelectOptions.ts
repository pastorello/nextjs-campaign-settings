import SelectOption from "../../definitions/types/SelectOption";

const sortSelectOptions = (optionList: SelectOption[]) =>
  optionList.sort((a, b) => {
    if (a.value === -1) {
      return -1;
    }
    if (b.value === -1) {
      return 1;
    }
    return a.label.localeCompare(b.label);
  });

export default sortSelectOptions;
