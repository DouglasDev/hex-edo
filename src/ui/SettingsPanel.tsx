import { useState, type ReactNode } from 'react';
import type { Settings, Timbre } from '../instrument/settings';
import { keySizeLabel } from '../instrument/keySize';
import { validMapping } from '../instrument/tuning';
import {
  Button,
  Detail,
  ErrorText,
  Field,
  NumberInput,
  Panel,
  PanelTitle,
  Range,
  Select,
  SizeReadout,
  SizeResetButton,
  SliderStack,
} from './styles';

interface Props {
  settings: Settings;
  mobile?: boolean;
  effectiveSize: number;
  tuning?: ReactNode;
  update: (value: Partial<Settings>) => void;
}

export function SettingsPanel({ settings, update, mobile = false, tuning, effectiveSize }: Props) {
  const [a, setA] = useState(String(settings.a));
  const [b, setB] = useState(String(settings.b));
  const valid =
    a.trim() !== '' &&
    b.trim() !== '' &&
    Math.abs(Number(a)) <= 12 &&
    Math.abs(Number(b)) <= 12 &&
    validMapping(Number(a), Number(b), settings.edo);
  const changed = Number(a) !== settings.a || Number(b) !== settings.b;

  return (
    <Panel id="settings-panel" aria-label="Instrument settings" data-mobile={mobile}>
      <PanelTitle>Settings</PanelTitle>
      {tuning}
      <Field>
        Right axis · steps
        <NumberInput
          aria-label="Right axis steps"
          type="number"
          min={-12}
          max={12}
          value={a}
          onChange={(event) => setA(event.target.value)}
        />
      </Field>
      <Field>
        Down-right axis · steps
        <NumberInput
          aria-label="Down-right axis steps"
          type="number"
          min={-12}
          max={12}
          value={b}
          onChange={(event) => setB(event.target.value)}
        />
      </Field>
      {!valid && (
        <ErrorText role="alert">
          Use whole numbers from −12 to 12 that reach every pitch of {settings.edo} EDO.
        </ErrorText>
      )}
      <Button disabled={!valid || !changed} onClick={() => update({ a: Number(a), b: Number(b) })}>
        Apply mapping
      </Button>
      <Detail>Root (degree 1): C4 · 261.626 Hz</Detail>
      <Field>
        Register
        <Select
          aria-label="Register"
          value={settings.register}
          onChange={(event) => update({ register: Number(event.target.value) })}
        >
          {[-2, -1, 0, 1, 2].map((value) => (
            <option key={value} value={value}>
              {value > 0 ? '+' : ''}
              {value} oct
            </option>
          ))}
        </Select>
      </Field>
      <Field>
        Key size
        <SliderStack>
          <Range
            aria-label="Key size"
            aria-describedby="key-size-readout"
            type="range"
            min={48}
            max={Math.max(240, Math.ceil(effectiveSize))}
            step={1}
            value={effectiveSize}
            onChange={(event) => update({ size: Number(event.target.value), sizeMode: 'pixels' })}
          />
          <SizeReadout id="key-size-readout" aria-live="polite">
            {keySizeLabel(effectiveSize)}
          </SizeReadout>
        </SliderStack>
      </Field>
      {mobile && (
        <SizeResetButton
          aria-pressed={settings.sizeMode === 'rows'}
          onClick={() => update({ sizeMode: 'rows' })}
        >
          Fit 5 rows
        </SizeResetButton>
      )}

      <Field>
        Timbre
        <Select
          aria-label="Timbre"
          value={settings.timbre}
          onChange={(event) => update({ timbre: event.target.value as Timbre })}
        >
          <option value="sine">Sine</option>
          <option value="triangle">Triangle</option>
          <option value="sawtooth">Soft saw</option>
        </Select>
      </Field>
      <Field>
        Volume
        <Range
          aria-label="Volume"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={settings.volume}
          onChange={(event) => update({ volume: Number(event.target.value) })}
        />
      </Field>
      <Detail>
        Key labels: degree · octave on touch screens; degree · octave · shortcut on desktop.
      </Detail>
      <Detail>
        Build <span data-testid="commit">{__APP_COMMIT__}</span>
      </Detail>
    </Panel>
  );
}
