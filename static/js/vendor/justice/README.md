# Justice 0.4.0

`engine.js` is the unmodified ESM distribution of `@kitlangton/justice@0.4.0`.
It is served locally; no package manager or CDN is needed to run this site.

- Source: https://github.com/kitlangton/justice
- Documentation: https://justice.kitlangton.com/docs.md
- Package: https://registry.npmjs.org/@kitlangton/justice/-/justice-0.4.0.tgz
- License: MIT (see LICENSE)

The biography adapter in `../../script.js` measures the existing font with canvas,
lays out each paragraph separately, and recomputes on width and font changes.
Columns narrower than 30 times the font size use natural, left-aligned wrapping.
Unsupported browsers and fitting failures use the same fallback.
