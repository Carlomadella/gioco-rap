#!/usr/bin/env python3
"""Ricompila il gioco in un file unico per l'artifact di Claude.

Prende index.html, mette dentro il contenuto di ogni CSS e di ogni JS
nell'ordine in cui compaiono, e toglie doctype/html/head/body: lo scheletro
della pagina lo aggiunge l'artifact.

    python3 strumenti/build-artifact.py [file-di-uscita]

© La Fame Studio. Tutti i diritti riservati.
"""
import re, sys, pathlib

RADICE = pathlib.Path(__file__).resolve().parent.parent
USCITA = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else RADICE / "dist" / "anni-di-fame.html"

html = (RADICE / "index.html").read_text(encoding="utf-8")

def leggi(rel):
    return (RADICE / rel.split("?")[0]).read_text(encoding="utf-8")

def css(m):
    href = m.group(1)
    if href.startswith("http"):
        return m.group(0)
    return "<style>\n/* === %s === */\n%s\n</style>" % (href.split("?")[0], leggi(href))

def js(m):
    src = m.group(1)
    if src.startswith("http"):
        return m.group(0)
    return "<script>\n/* === %s === */\n%s\n</script>" % (src.split("?")[0], leggi(src))

html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', css, html)
html = re.sub(r'<script src="([^"]+)"></script>', js, html)

# via lo scheletro: lo mette l'artifact
html = re.sub(r'<!doctype html>\s*', '', html, flags=re.I)
html = re.sub(r'</?html[^>]*>\s*', '', html, flags=re.I)
html = re.sub(r'</?head>\s*', '', html, flags=re.I)
html = re.sub(r'</?body>\s*', '', html, flags=re.I)
html = re.sub(r'<meta charset[^>]*>\s*', '', html, flags=re.I)
html = re.sub(r'<meta name="viewport"[^>]*>\s*', '', html, flags=re.I)

USCITA.parent.mkdir(parents=True, exist_ok=True)
USCITA.write_text(html.strip() + "\n", encoding="utf-8")
print("scritto %s (%.0f KB)" % (USCITA, USCITA.stat().st_size / 1024))
