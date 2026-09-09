# Page/runtime viewport patch

- Removes the legacy runtime `max-w-7xl` / rounded white shell / padding wrapper.
- Runtime now renders the root `Page` directly at its declared logical size.
- `Page` uses an explicit height in addition to min-height, so the viewport has a real declared size.
- Adds `PageViewportFrame` for the Designer.
- Desktop pages auto-fit to the available Designer canvas width while preserving their logical dimensions and aspect ratio.
- Tablet/mobile pages keep their declared size and are only scaled down when they do not fit.
