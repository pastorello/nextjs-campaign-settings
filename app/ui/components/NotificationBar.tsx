import { SnackbarList } from "@wordpress/components";
import { store as noticesStore } from "@wordpress/notices";
import { useSelect, useDispatch } from "@wordpress/data";

function NotificationsBar() {
  const notices = useSelect(
    (select: any) => select(noticesStore).getNotices(),
    [],
  );
  const { removeNotice } = useDispatch(noticesStore);
  const snackbarNotices = notices.filter(
    ({ type }: any) => type === "snackbar",
  );

  return (
    <SnackbarList
      notices={snackbarNotices.map((item: any) => ({
        id: item.id,
        content: item.content,
      }))}
      className="components-editor-notices__snackbar"
      onRemove={removeNotice}
    />
  );
}

export default NotificationsBar;
