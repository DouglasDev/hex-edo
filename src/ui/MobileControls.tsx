import { CornerButton, MenuButton } from './mobileStyles';

interface Props {
  open: boolean;
  onMenu: () => void;
  fullscreen: boolean;
  fullscreenSupported: boolean;
  onFullscreen: () => void;
}

export function MobileControls({
  open,
  onMenu,
  fullscreen,
  fullscreenSupported,
  onFullscreen,
}: Props) {
  return (
    <>
      <MenuButton
        aria-label="Settings"
        aria-expanded={open}
        aria-controls="settings-panel"
        onClick={onMenu}
      >
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {open ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </MenuButton>
      <CornerButton
        data-fullscreen-control
        aria-label={fullscreen ? 'Minimize fullscreen' : 'Enter fullscreen'}
        title={
          !fullscreenSupported
            ? 'Fullscreen unavailable in this browser'
            : fullscreen
              ? 'Minimize fullscreen'
              : 'Enter fullscreen'
        }
        disabled={!fullscreenSupported}
        onClick={onFullscreen}
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d={
              fullscreen
                ? 'M4 9h5V4m6 0v5h5M4 15h5v5m6 0v-5h5'
                : 'M9 4H4v5m11-5h5v5M4 15v5h5m6 0h5v-5'
            }
          />
        </svg>
      </CornerButton>
    </>
  );
}
