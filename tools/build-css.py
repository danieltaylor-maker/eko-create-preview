#!/usr/bin/env python3
"""Rebuilds the two combined stylesheets and updates their version stamps in the pages (Claude, 16 Nov 2026).
Run from the site folder after editing any file in assets/css:   python3 tools/build-css.py
  home.bundle.css  = styles + hybrid + icons + motion + reel-poster   (homepage)
  pages.bundle.css = styles + hybrid + icons + pages + motion         (service, About, Clients, Privacy pages)
Edit the separate files, never the bundles."""
import glob, hashlib, re
def build(name, parts):
    css = ''.join('/* ---- %s.css ---- */\n' % p + open('assets/css/%s.css' % p, encoding='utf-8').read().rstrip() + '\n' for p in parts)
    open('assets/css/%s.bundle.css' % name, 'w', encoding='utf-8').write(css)
    return hashlib.sha1(css.encode()).hexdigest()[:8]
stamps = {'home': build('home', ['styles', 'hybrid', 'icons', 'motion', 'reel-poster']),
          'pages': build('pages', ['styles', 'hybrid', 'icons', 'pages', 'motion'])}
for path in ['index.html'] + glob.glob('*/index.html'):
    html = open(path, encoding='utf-8').read()
    new = re.sub(r'(assets/css/(home|pages)\.bundle\.css)\?v=\w+', lambda m: '%s?v=%s' % (m.group(1), stamps[m.group(2)]), html)
    if new != html:
        open(path, 'w', encoding='utf-8').write(new); print('updated', path)
print(stamps)
