/**
 * A native `<select>` standing in for the Headless UI listbox, which jsdom
 * cannot drive by label. Shared by the account component tests.
 */
export default function SelectStub({
  label,
  value,
  options = [],
  onChange,
}: {
  label?: string;
  value: string;
  options?: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
