import ListItem from "../ListItem";

interface ItemPageManager {
  pageId?: number;
  onComplete?: (anItem: ListItem) => void;
  onCancel?: () => void;
}

export default ItemPageManager;
