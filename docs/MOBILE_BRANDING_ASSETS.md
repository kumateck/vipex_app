# Mobile Branding Assets Needed

Please provide these assets for `apps/mobile/assets/`:

## App Icon

- `icon.png`
- Size: 1024x1024
- Format: PNG
- No transparency preferred

## Android Adaptive Icon

- `adaptive-icon.png`
- Foreground only, transparent background
- Size: 1024x1024 PNG
- Safe center content (avoid edge clipping)

## Splash

- `splash-icon.png`
- Recommended: 1242x2436 PNG (or larger with same ratio)
- Keep logo centered

## Favicon (Expo web only)

- `favicon.png`
- 48x48 PNG

## Optional Store Assets (recommended)

- Play Store feature graphic: 1024x500
- iOS App Store icon export set from 1024 source

## Current Config References

Configured in:

- `apps/mobile/app.json`

Fields using assets:

- `expo.icon`
- `expo.android.adaptiveIcon.foregroundImage`
- `expo.splash.image`
- `expo.web.favicon`

## If You Want White/Colored Variants

Provide:

- `icon-light.png`
- `icon-dark.png`

Then we can support themed icons and splash variants.
