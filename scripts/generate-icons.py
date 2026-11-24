# Regenerates the app icons from the vector bus glyph: python3 scripts/generate-icons.py (needs Google Chrome).
import os, subprocess, sys, tempfile
S = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'images')
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ORANGE = "#FF5500"
# Material "directions_bus" glyph (24x24), the same icon the app uses.
BUS = ("M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78"
       "c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5"
       "S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z")

def svg(size, bg=None, radius=0.0, glyph=0.5, color="#FFFFFF"):
    """bg: fill colour or None (transparent); radius: corner radius as a share of size; glyph: glyph width share."""
    g = size * glyph
    # The bus fills x 4..20 and y 2..21 of its 24 box: centre that part, not the box.
    s = g / 16.0
    tx = (size - 16 * s) / 2 - 4 * s
    ty = (size - 19 * s) / 2 - 2 * s
    rect = f'<rect width="{size}" height="{size}" rx="{size*radius}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">'
            f'{rect}<path transform="translate({tx} {ty}) scale({s})" fill="{color}" d="{BUS}"/></svg>')

def render(name, size, **kw):
    html = os.path.join(tempfile.gettempdir(), "para-icon-" + name + ".html")
    open(html, "w").write(
        f'<!doctype html><html><head><style>html,body{{margin:0;background:transparent;overflow:hidden}}'
        f'svg{{display:block}}</style></head><body>{svg(size, **kw)}</body></html>')
    out = os.path.join(S, name + ".png")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                    "--default-background-color=00000000", f"--window-size={size},{size}",
                    f"--screenshot={out}", "file://" + html], check=True, capture_output=True)
    print(name, size)

# iOS / store icon: full bleed (the system rounds the corners), bus at ~46% like the reference.
render("icon", 1024, bg=ORANGE, glyph=0.46)
# Android adaptive icon (108dp canvas, ~66dp safe zone): transparent foreground, solid background.
render("android-icon-foreground", 512, glyph=0.30)
render("android-icon-background", 512, bg=ORANGE, glyph=0, color="none")
render("android-icon-monochrome", 432, glyph=0.30)
# Splash: the rounded app tile, as in the reference.
render("splash-icon", 512, bg=ORANGE, radius=0.24, glyph=0.46)
# Web favicon: rounded tile.
render("favicon", 48, bg=ORANGE, radius=0.24, glyph=0.52)

