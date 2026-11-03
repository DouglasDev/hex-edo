# Hex EDO

A mobile landscape instrument for 2–9 EDO. Desktop supports the 26 letter and 10 number keys, with shortcuts printed on the keys. Touch or click a key to play; drag to bend continuously through neighboring pitches. Each touch controls its own voice.

## Development

Use Node 24 and pnpm 10.12.4.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm run format
pnpm run format:check
pnpm run typecheck
pnpm test
pnpm run test:browser
pnpm run build
```

Browser tests use Playwright Chromium and WebKit (`pnpm exec playwright install chromium webkit`).

## Mapping

Axial hex coordinates map to `origin + a*q + b*r + register*EDO`. Defaults are `a=1`, `b=ceil(EDO/2)`. Valid mappings require `gcd(a,b,EDO)=1`; this guarantees coverage on the infinite lattice, not necessarily every finite screen crop. Degree zero is C4 (261.625565 Hz). Octaves use mathematical floor division, including negative steps. Key labels show degree and octave on touch devices, degree, octave and physical key shortcut on desktop. Desktop follows the physical number / QWERTY / ASDF / ZXCV rows, with up to 36 keys. Narrow windows clip the right end of each row without wrapping shortcuts. Mobile has no key-count cap: whole hexagons fill the available viewport without outer borders or padding. Smaller screens or larger key sizes show fewer whole keys.

Touch-down is quantized to a key. Movement exceeding 3 CSS pixels follows the affine pitch field through key centers, smoothed by an 8 ms audio time constant. No pitch snapping occurs at rest. Touches remain captured outside the board until lifted. Extreme custom mappings are limited to 8–20000 Hz at attack and during bends for audio safety. Audio is activated by a user gesture; interrupted audio requires Resume audio. Settings are stored locally when storage is available. Default volume is 60%; the previous 30% default migrates to 60%, while other saved volume settings are preserved.

Mobile controls live in a hamburger overlay; changing EDO closes the menu and restores playing focus. Start playing on the portrait screen enables audio, requests fullscreen and then locks landscape in one tap where the browser supports both APIs. Landscape entry also requests fullscreen, retrying on a tap if activation is required. The bottom-right control exits fullscreen and unlocks orientation; exiting via browser controls is respected. Unsupported fullscreen/orientation APIs fall back to the edge-to-edge viewport and a manual rotation prompt.

## Deployment

Public repository: https://github.com/DouglasDev/hex-edo

Site: https://douglasdev.github.io/hex-edo/

Enable GitHub Pages with GitHub Actions as the source. Each push to main runs formatting, TypeScript checks, unit tests, and a production build before deploying. `version.json` and Settings show the source commit. Run checks before every commit, push each commit, and verify its deployment before making the next commit. No service worker caches old versions.

Physical iPhone/Android multitouch and audio latency require testing on the devices. Browser emulation does not establish real hardware latency or operating-system interruption behavior.
