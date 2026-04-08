import ListItem from "../ListItem";

interface ListPage {
  itemStats: ListItem;
  filteredResults: ListItem[];
  keyFilters: ListItem;
  sortFilters: ListItem;
  resetFilters: () => void;
}

export default ListPage;
