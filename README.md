# Add the Message Vault home-screen icon to your existing GitHub Pages app

1. Upload all six icon/manifest files from this folder into the same repository folder as index.html (usually the repo root).
2. In your EXISTING index.html, inside <head> and above </head>, add:

```html
<meta name="theme-color" content="#111111" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="Message Vault" />
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png?v=2" />
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png?v=2" />
<link rel="icon" type="image/png" sizes="16x16" href="favicon-16.png?v=2" />
<link rel="manifest" href="site.webmanifest" />
```

Don't replace your existing index.html. Add only the lines you don't already have. If you're updating an older icon, bump `v=2` to `v=3` and remove/readd the home-screen shortcut on iPhone.

iPhone: open the LIVE GitHub Pages URL in Safari → Share → Add to Home Screen → Add.
