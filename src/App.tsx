import { useEffect, useState } from 'react';
import { Synth, type AudioStatus } from './audio/Synth';
import { Keyboard } from './keyboard/Keyboard';
import { readSettings, saveSettings, type Settings } from './instrument/settings';
import { useDevice } from './ui/useDevice';
import { SettingsPanel } from './ui/SettingsPanel';
import {
  Activation,
  BoardFrame,
  BoardTopline,
  Brand,
  Button,
  Controls,
  EnableButton,
  Footer,
  Header,
  Mark,
  RootLegend,
  Rotate,
  RotateIcon,
  Select,
  Shell,
  Status,
  TuningLabel,
  Workspace,
} from './ui/styles';

export function App() {
  const [settings, setSettings] = useState(readSettings);
  const [synth] = useState(() => new Synth());
  const [audio, setAudio] = useState<AudioStatus>('off');
  const [open, setOpen] = useState(false);
  const { desktop, portrait } = useDevice();

  useEffect(() => {
    synth.onStatus = setAudio;

    return () => synth.dispose();
  }, [synth]);

  useEffect(() => {
    saveSettings(settings);
    synth.setVolume(settings.volume);
  }, [settings, synth]);

  useEffect(() => {
    if (portrait || open) synth.releaseAll();
  }, [portrait, open, synth]);

  const update = (value: Partial<Settings>) =>
    setSettings((previous) => ({ ...previous, ...value }));

  if (portrait)
    return (
      <Rotate>
        <RotateIcon aria-hidden="true" />
        <span>Rotate your phone</span>
      </Rotate>
    );

  return (
    <Shell>
      <Header>
        <Brand>
          <Mark aria-hidden="true">⬡</Mark>Hex EDO
        </Brand>
        <Controls>
          <TuningLabel>
            Tuning
            <Select
              aria-label="EDO tuning"
              value={settings.edo}
              onChange={(event) => {
                const edo = Number(event.target.value);

                update({ edo, a: 1, b: Math.ceil(edo / 2) });
              }}
            >
              {[2, 3, 4, 5, 6, 7, 8, 9].map((edo) => (
                <option key={edo} value={edo}>
                  {edo} EDO
                </option>
              ))}
            </Select>
          </TuningLabel>
          <Button
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="settings-panel"
            aria-pressed={open}
          >
            Settings
          </Button>
        </Controls>
      </Header>
      <Workspace>
        <BoardTopline>
          <span>
            → {settings.a > 0 ? '+' : ''}
            {settings.a} &nbsp; ↘ {settings.b > 0 ? '+' : ''}
            {settings.b} steps
          </span>
          <Status data-ready={audio === 'ready'} role="status">
            {audio === 'ready'
              ? 'Audio on'
              : audio === 'off'
                ? 'Audio off'
                : audio === 'error'
                  ? 'Audio unavailable · retry'
                  : 'Audio paused'}
          </Status>
        </BoardTopline>
        <BoardFrame>
          <Keyboard
            settings={settings}
            desktop={desktop}
            synth={synth}
            enabled={audio === 'ready' && !open}
          />
          {audio !== 'ready' && (
            <Activation>
              <EnableButton onClick={() => void synth.enable()}>
                {audio === 'off' ? 'Enable audio' : 'Resume audio'}
              </EnableButton>
            </Activation>
          )}
        </BoardFrame>
        {open && <SettingsPanel key={settings.edo} settings={settings} update={update} />}
      </Workspace>
      <Footer>
        <RootLegend>Root · degree 0</RootLegend>
        <span>
          {desktop ? 'Letters / numbers to play · drag to bend' : 'Touch to play · slide to bend'}
        </span>
      </Footer>
    </Shell>
  );
}
