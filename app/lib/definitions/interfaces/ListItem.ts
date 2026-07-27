/**
 * A record keyed by field name, whose values are only known at runtime.
 *
 * The index signature was `any` until TD-08 step 4, which meant every read
 * through it was unchecked — and, worse, silently disabled checking on whatever
 * the value was passed to. `unknown` keeps the dynamic access and forces the
 * reader to say what they expect.
 */
interface ListItem {
  [key: string]: unknown;
}

export default ListItem;
