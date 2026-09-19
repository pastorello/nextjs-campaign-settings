enum ControlType {
  Text = "text",
  Textarea = "textarea",
  /** Formatted text edited with a toolbar (SPEC-019, ADR-0016). */
  RichText = "richText",
  Bool = "bool",
  Select = "select",
  Multiselect = "multiselect",
  /** One uploaded image: its value is a `recordImage` id (SPEC-020 T3). */
  Image = "image",
}

export default ControlType;
