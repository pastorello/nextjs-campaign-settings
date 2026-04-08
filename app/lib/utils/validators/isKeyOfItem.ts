export default function isKeyOfItem(
  key: string | number | symbol,
  obj: object
): key is keyof typeof obj {
  return key in obj;
}
