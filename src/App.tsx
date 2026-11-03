import { useEffect, useState } from 'react';
import { Synth, type AudioStatus } from './audio/Synth';
import { Keyboard } from './keyboard/Keyboard';
import { readSettings, saveSettings, type Settings } from './instrument/settings';
import { useDevice } from './ui/useDevice';
import { useMobileDisplay } from './ui/useMobileDisplay';
import { MobileControls } from './ui/MobileControls';
import { SettingsPanel } from './ui/SettingsPanel';
import { TuningControl } from './ui/TuningControl';
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
  Shell,
  Status,
  Workspace,
} from './ui/styles';

export function App() {
  const [settings, setSettings] = useState(readSettings);
  const [synth] = useState(() => new Synth());
  const [audio, setAudio] = useState<AudioStatus>('off');
  const [open, setOpen] = useState(false);
  const { desktop, portrait } = useDevice();
  const display = useMobileDisplay(!desktop, portrait);

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

  const start = () => {
    void synth.enable();
    if (!desktop) display.start();
  };

  const changeTuning = (edo: number) => {
    update({ edo, a: 1, b: Math.ceil(edo / 2) });
    setOpen(false);
  };

  const tuning = <TuningControl edo={settings.edo} onChange={changeTuning} />;
  const status = (
    <Status data-ready={audio === 'ready'} role="status">
      {audio === 'ready'
        ? 'Audio on'
        : audio === 'off'
          ? 'Audio off'
          : audio === 'error'
            ? 'Audio unavailable · retry'
            : 'Audio paused'}
    </Status>
  );

  if (portrait)
    return (
      <Rotate>
        <RotateIcon aria-hidden="true" />
        <EnableButton onClick={start}>Start playing</EnableButton>
        {display.manualRotation && <span>Rotate your phone</span>}
      </Rotate>
    );

  return (
    <Shell data-mobile={!desktop}>
      {desktop && (
        <Header>
          <Brand>
            <Mark aria-hidden="true">⬡</Mark>Hex EDO
          </Brand>
          <Controls>
            {tuning}
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
      )}
      {!desktop && (
        <MobileControls
          open={open}
          onMenu={() => setOpen((value) => !value)}
          fullscreen={display.active}
          fullscreenSupported={display.supported}
          onFullscreen={display.toggle}
        />
      )}
      <Workspace>
        {desktop && (
          <BoardTopline>
            <span>
              → {settings.a > 0 ? '+' : ''}
              {settings.a} &nbsp; ↘ {settings.b > 0 ? '+' : ''}
              {settings.b} steps
            </span>
            {status}
          </BoardTopline>
        )}
        <BoardFrame data-mobile={!desktop}>
          <Keyboard
            settings={settings}
            desktop={desktop}
            synth={synth}
            enabled={audio === 'ready' && !open}
          />
          {audio !== 'ready' && (
            <Activation>
              <EnableButton onClick={start}>
                {audio === 'off' ? 'Enable audio' : 'Resume audio'}
              </EnableButton>
            </Activation>
          )}
        </BoardFrame>
        {open && (
          <SettingsPanel
            key={settings.edo}
            settings={settings}
            update={update}
            mobile={!desktop}
            tuning={
              !desktop ? (
                <>
                  {tuning}
                  {status}
                </>
              ) : undefined
            }
          />
        )}
      </Workspace>
      {desktop && (
        <Footer>
          <RootLegend>Root · degree 0</RootLegend>
          <span>Letters / numbers to play · drag to bend</span>
        </Footer>
      )}
    </Shell>
  );
}
