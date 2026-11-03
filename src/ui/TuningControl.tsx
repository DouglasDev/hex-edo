import { Select, TuningLabel } from './styles';

interface Props {
  edo: number;
  onChange: (edo: number) => void;
}

export function TuningControl({ edo, onChange }: Props) {
  return (
    <TuningLabel>
      Tuning
      <Select
        aria-label="EDO tuning"
        value={edo}
        onChange={(event) => {
          onChange(Number(event.target.value));
          event.currentTarget.blur();
        }}
      >
        {[2, 3, 4, 5, 6, 7, 8, 9].map((value) => (
          <option key={value} value={value}>
            {value} EDO
          </option>
        ))}
      </Select>
    </TuningLabel>
  );
}
