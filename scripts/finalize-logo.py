#!/usr/bin/env python3
"""Build the final Adiviath logo pack from the approved raster reference.

The script traces the two flat colour regions into closed SVG paths, then uses
those paths as the source for every vector and bitmap export.
"""

from __future__ import annotations

import json
import math
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image


PROJECT = Path(__file__).resolve().parents[1]
OUT = PROJECT / "public" / "brand"
SOURCE_DIR = OUT / "source"
PNG_DIR = OUT / "png"
ICON_DIR = OUT / "icons"

DARK = "#181818"
PURPLE = "#5D3FF0"
ORANGE = "#EB8752"
WHITE = "#FFFFFF"
BLACK = "#000000"


def signed_area(points: list[tuple[float, float]]) -> float:
    return sum(
        points[i][0] * points[(i + 1) % len(points)][1]
        - points[(i + 1) % len(points)][0] * points[i][1]
        for i in range(len(points))
    ) / 2


def point_line_distance(point, start, end) -> float:
    if start == end:
        return math.dist(point, start)
    x, y = point
    x1, y1 = start
    x2, y2 = end
    numerator = abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1)
    denominator = math.hypot(y2 - y1, x2 - x1)
    return numerator / denominator


def rdp(points: list[tuple[float, float]], epsilon: float) -> list[tuple[float, float]]:
    if len(points) < 3:
        return points
    index = 0
    distance = 0.0
    for i in range(1, len(points) - 1):
        candidate = point_line_distance(points[i], points[0], points[-1])
        if candidate > distance:
            index, distance = i, candidate
    if distance > epsilon:
        left = rdp(points[: index + 1], epsilon)
        right = rdp(points[index:], epsilon)
        return left[:-1] + right
    return [points[0], points[-1]]


def simplify_closed(points: list[tuple[int, int]], epsilon: float = 2.25):
    # Rotate to a stable far-left point, split the ring, and simplify both arcs.
    pivot = min(range(len(points)), key=lambda i: (points[i][0], points[i][1]))
    ring = points[pivot:] + points[:pivot]
    opposite = max(range(len(ring)), key=lambda i: math.dist(ring[0], ring[i]))
    first = rdp(ring[: opposite + 1], epsilon)
    second = rdp(ring[opposite:] + [ring[0]], epsilon)
    result = first[:-1] + second[:-1]
    return result if signed_area(result) > 0 else list(reversed(result))


def boundary_loops(mask: list[list[bool]]) -> list[list[tuple[int, int]]]:
    height, width = len(mask), len(mask[0])
    edges: dict[tuple[int, int], list[tuple[int, int]]] = {}

    def add(start, end):
        edges.setdefault(start, []).append(end)

    for y in range(height):
        for x in range(width):
            if not mask[y][x]:
                continue
            if y == 0 or not mask[y - 1][x]:
                add((x, y), (x + 1, y))
            if x == width - 1 or not mask[y][x + 1]:
                add((x + 1, y), (x + 1, y + 1))
            if y == height - 1 or not mask[y + 1][x]:
                add((x + 1, y + 1), (x, y + 1))
            if x == 0 or not mask[y][x - 1]:
                add((x, y + 1), (x, y))

    unused = {(start, end) for start, ends in edges.items() for end in ends}
    loops = []
    while unused:
        start_edge = next(iter(unused))
        start, current = start_edge
        loop = [start, current]
        unused.remove(start_edge)
        while current != start:
            candidates = [end for end in edges.get(current, []) if (current, end) in unused]
            if not candidates:
                break
            nxt = candidates[0]
            unused.remove((current, nxt))
            loop.append(nxt)
            current = nxt
        if current == start and len(loop) > 12:
            loops.append(loop[:-1])
    return loops


def smooth_path(points: list[tuple[float, float]]) -> str:
    # Quadratic midpoint smoothing removes pixel stair-steps while retaining the silhouette.
    n = len(points)
    midpoint = lambda a, b: ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    start = midpoint(points[-1], points[0])
    commands = [f"M{start[0]:.2f} {start[1]:.2f}"]
    for i, point in enumerate(points):
        end = midpoint(point, points[(i + 1) % n])
        commands.append(f"Q{point[0]:.2f} {point[1]:.2f} {end[0]:.2f} {end[1]:.2f}")
    commands.append("Z")
    return " ".join(commands)


def trace_paths(image: Image.Image) -> tuple[str, str]:
    rgb = image.convert("RGB")
    width, height = rgb.size
    purple = [[False] * width for _ in range(height)]
    orange = [[False] * width for _ in range(height)]
    pixels = rgb.load()
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            purple[y][x] = b > 105 and b - r > 70 and b - g > 45
            orange[y][x] = r > 120 and r - b > 45 and g > 55

    def path_for(mask):
        loops = boundary_loops(mask)
        loops = [loop for loop in loops if abs(signed_area(loop)) > 60]
        loops.sort(key=lambda loop: abs(signed_area(loop)), reverse=True)
        return " ".join(smooth_path(simplify_closed(loop)) for loop in loops)

    return path_for(purple), path_for(orange)


def defs() -> str:
    return f"""<defs>
  <linearGradient id="purple" x1="54" y1="57" x2="318" y2="331" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#7138FF"/><stop offset="0.48" stop-color="{PURPLE}"/><stop offset="1" stop-color="#5237E4"/>
  </linearGradient>
  <linearGradient id="orange" x1="142" y1="176" x2="208" y2="244" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#FF7833"/><stop offset="1" stop-color="{ORANGE}"/>
  </linearGradient>
</defs>"""


def symbol_group(mark_path: str, dot_path: str, mark_fill: str, dot_fill: str) -> str:
    return (
        f'<path d="{mark_path}" fill="{mark_fill}" fill-rule="evenodd"/>'
        f'<path d="{dot_path}" fill="{dot_fill}" fill-rule="evenodd"/>'
    )


def svg_document(body: str, width=390, height=380, viewbox="0 0 390 380", extra="") -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="{viewbox}" role="img" aria-label="Adiviath logo">{extra}{body}</svg>\n'
    )


def write_svg(name: str, body: str, width=390, height=380, viewbox="0 0 390 380", extra=""):
    path = OUT / name
    path.write_text(svg_document(body, width, height, viewbox, extra), encoding="utf-8")
    return path


def render(svg: Path, png: Path, width: int, height: int | None = None):
    png.parent.mkdir(parents=True, exist_ok=True)
    height = height or width
    script = """
import sharp from 'sharp';
const [source, destination, width, height] = process.argv.slice(1);
await sharp(source)
  .resize(Number(width), Number(height), { fit: 'fill' })
  .png()
  .toFile(destination);
"""
    subprocess.run(
        ["node", "--input-type=module", "-e", script, str(svg), str(png), str(width), str(height)],
        check=True,
        stdout=subprocess.DEVNULL,
    )


def build(source: Path):
    OUT.mkdir(parents=True, exist_ok=True)
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    PNG_DIR.mkdir(parents=True, exist_ok=True)
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    stored_reference = SOURCE_DIR / "approved-reference.png"
    if source != stored_reference.resolve():
        shutil.copy2(source, stored_reference)

    image = Image.open(source)
    mark_path, dot_path = trace_paths(image)
    path_data = {"viewBox": "0 0 390 380", "mark": mark_path, "dot": dot_path}
    path_json = json.dumps(path_data, indent=2) + "\n"
    (SOURCE_DIR / "paths.json").write_text(path_json, encoding="utf-8")
    site_data = PROJECT / "src" / "data"
    site_data.mkdir(parents=True, exist_ok=True)
    (site_data / "logo-paths.json").write_text(path_json, encoding="utf-8")

    gradient = symbol_group(mark_path, dot_path, "url(#purple)", "url(#orange)")
    flat = symbol_group(mark_path, dot_path, PURPLE, ORANGE)
    black = symbol_group(mark_path, dot_path, BLACK, BLACK)
    white = symbol_group(mark_path, dot_path, WHITE, WHITE)
    cocoa = symbol_group(mark_path, dot_path, "#654332", "#EDAB78")
    light = symbol_group(mark_path, dot_path, "#FFFAF3", "#EDAB78")

    gradient_svg = write_svg("symbol-gradient.svg", gradient, extra=defs())
    flat_svg = write_svg("symbol-flat.svg", flat)
    write_svg("symbol-black.svg", black)
    write_svg("symbol-white.svg", white)
    write_svg("symbol-purple.svg", symbol_group(mark_path, dot_path, PURPLE, PURPLE))
    cocoa_svg = write_svg("symbol-cocoa.svg", cocoa)
    light_svg = write_svg("symbol-light.svg", light)
    write_svg("symbol-gradient-dark.svg", f'<rect width="390" height="380" fill="{DARK}"/>{gradient}', extra=defs())
    write_svg("symbol-gradient-light.svg", f'<rect width="390" height="380" fill="{WHITE}"/>{gradient}', extra=defs())

    # Square social/profile versions with generous safe area for circular crops.
    profile_transform = 'transform="translate(110 132) scale(2.06)"'
    write_svg(
        "profile-dark.svg",
        f'<rect width="1024" height="1024" fill="{DARK}"/><g {profile_transform}>{gradient}</g>',
        1024,
        1024,
        "0 0 1024 1024",
        defs(),
    )
    write_svg(
        "profile-light.svg",
        f'<rect width="1024" height="1024" fill="{WHITE}"/><g {profile_transform}>{gradient}</g>',
        1024,
        1024,
        "0 0 1024 1024",
        defs(),
    )
    write_svg(
        "profile-cocoa.svg",
        f'<rect width="1024" height="1024" fill="#654332"/><g {profile_transform}>{light}</g>',
        1024,
        1024,
        "0 0 1024 1024",
    )
    write_svg(
        "profile-cream.svg",
        f'<rect width="1024" height="1024" fill="#FFFAF3"/><g {profile_transform}>{cocoa}</g>',
        1024,
        1024,
        "0 0 1024 1024",
    )

    # Browser/app icons use the mark with less padding to remain recognizable small.
    icon_transform = 'transform="translate(39 45) scale(.82)"'
    favicon_svg = write_svg(
        "favicon.svg",
        f'<rect width="390" height="390" rx="82" fill="{DARK}"/><g {icon_transform}>{gradient}</g>',
        390,
        390,
        "0 0 390 390",
        defs(),
    )

    # Joined lockups: the symbol supplies the initial “A”, followed by “diviath”.
    def lockup(mark_fill, dot_fill, text_fill, background=None, gradient_defs=""):
        bg = f'<rect width="1200" height="320" fill="{background}"/>' if background else ""
        symbol = symbol_group(mark_path, dot_path, mark_fill, dot_fill)
        return (
            bg
            + f'<g transform="translate(24 32) scale(.67)">{symbol}</g>'
            + f'<text x="282" y="218" fill="{text_fill}" font-family="Segoe UI,Arial,sans-serif" font-size="184" font-weight="700" letter-spacing="-9">diviath</text>'
            + f'<text x="1137" y="276" text-anchor="end" fill="{text_fill}" font-family="Segoe UI,Arial,sans-serif" font-size="46" font-weight="700" letter-spacing="1">technologies</text>'
        )

    wordmark_gradient = write_svg(
        "wordmark-gradient.svg",
        lockup("url(#purple)", "url(#orange)", DARK),
        1200,
        320,
        "0 0 1200 320",
        defs(),
    )
    write_svg("wordmark-black.svg", lockup(BLACK, BLACK, BLACK), 1200, 320, "0 0 1200 320")
    write_svg("wordmark-white.svg", lockup(WHITE, WHITE, WHITE), 1200, 320, "0 0 1200 320")
    write_svg("wordmark-cocoa.svg", lockup("#654332", "#EDAB78", "#654332"), 1200, 320, "0 0 1200 320")
    write_svg("wordmark-light.svg", lockup("#FFFAF3", "#EDAB78", "#FFFAF3"), 1200, 320, "0 0 1200 320")
    write_svg(
        "wordmark-gradient-dark.svg",
        lockup("url(#purple)", "url(#orange)", WHITE, DARK),
        1200,
        320,
        "0 0 1200 320",
        defs(),
    )

    def social_card(background: str, title: str, subtitle: str):
        text = WHITE if background == DARK else DARK
        return (
            f'<rect width="1200" height="630" fill="{background}"/>'
            f'<g transform="translate(64 118) scale(.92)">{gradient}</g>'
            f'<text x="466" y="280" fill="{text}" font-family="Segoe UI,Arial,sans-serif" font-size="70" font-weight="700" letter-spacing="-3">{title}</text>'
            f'<text x="470" y="352" fill="{text}" opacity=".72" font-family="Segoe UI,Arial,sans-serif" font-size="31" font-weight="500">{subtitle}</text>'
        )

    write_svg(
        "social-card-dark.svg",
        social_card(DARK, "Adiviath Technologies", "Software made to fit."),
        1200,
        630,
        "0 0 1200 630",
        defs(),
    )
    write_svg(
        "social-card-light.svg",
        social_card(WHITE, "Adiviath Technologies", "Software made to fit."),
        1200,
        630,
        "0 0 1200 630",
        defs(),
    )
    write_svg(
        "social-card.svg",
        (
            '<rect width="1200" height="630" fill="#FFFAF3"/>'
            f'<g transform="translate(64 118) scale(.92)">{cocoa}</g>'
            '<text x="466" y="280" fill="#654332" font-family="Segoe UI,Arial,sans-serif" font-size="70" font-weight="700" letter-spacing="-3">Adiviath Technologies</text>'
            '<text x="470" y="352" fill="#75685F" font-family="Segoe UI,Arial,sans-serif" font-size="31" font-weight="500">Software made to fit.</text>'
        ),
        1200,
        630,
        "0 0 1200 630",
    )

    for size in (32, 64, 128, 256, 512, 1024):
        render(gradient_svg, PNG_DIR / f"symbol-gradient-{size}.png", size)
    render(flat_svg, PNG_DIR / "symbol-flat-1024.png", 1024)
    render(OUT / "symbol-black.svg", PNG_DIR / "symbol-black-1024.png", 1024)
    render(OUT / "symbol-white.svg", PNG_DIR / "symbol-white-1024.png", 1024)
    render(OUT / "symbol-purple.svg", PNG_DIR / "symbol-purple-1024.png", 1024)
    render(OUT / "symbol-gradient-dark.svg", PNG_DIR / "symbol-gradient-dark-1024.png", 1024)
    render(OUT / "symbol-gradient-light.svg", PNG_DIR / "symbol-gradient-light-1024.png", 1024)
    render(OUT / "profile-dark.svg", PNG_DIR / "profile-dark-1024.png", 1024)
    render(OUT / "profile-light.svg", PNG_DIR / "profile-light-1024.png", 1024)
    render(wordmark_gradient, PNG_DIR / "wordmark-gradient-2400.png", 2400, 640)
    render(OUT / "wordmark-gradient-dark.svg", PNG_DIR / "wordmark-gradient-dark-2400.png", 2400, 640)
    render(OUT / "wordmark-black.svg", PNG_DIR / "wordmark-black-2400.png", 2400, 640)
    render(OUT / "wordmark-white.svg", PNG_DIR / "wordmark-white-2400.png", 2400, 640)
    render(OUT / "social-card-dark.svg", PNG_DIR / "social-card-dark-1200x630.png", 1200, 630)
    render(OUT / "social-card-light.svg", PNG_DIR / "social-card-light-1200x630.png", 1200, 630)
    # Compatibility exports at their historic root paths, now using the exact same master shape.
    for name, svg in (
        ("symbol-cocoa", cocoa_svg),
        ("symbol-light", light_svg),
        ("symbol-black", OUT / "symbol-black.svg"),
        ("symbol-white", OUT / "symbol-white.svg"),
    ):
        render(svg, OUT / f"{name}.png", 768)
    for name in ("wordmark-cocoa", "wordmark-light", "wordmark-black", "wordmark-white"):
        render(OUT / f"{name}.svg", OUT / f"{name}.png", 1200, 320)
    for name in ("profile-cocoa", "profile-cream"):
        render(OUT / f"{name}.svg", OUT / f"{name}.png", 1024)
    render(OUT / "social-card.svg", OUT / "social-card.png", 1200, 630)
    render(favicon_svg, ICON_DIR / "favicon-16.png", 16)
    render(favicon_svg, ICON_DIR / "favicon-32.png", 32)
    render(favicon_svg, ICON_DIR / "apple-touch-icon.png", 180)
    render(favicon_svg, ICON_DIR / "icon-192.png", 192)
    render(favicon_svg, ICON_DIR / "icon-512.png", 512)
    subprocess.run(
        ["magick", str(ICON_DIR / "favicon-16.png"), str(ICON_DIR / "favicon-32.png"), str(ICON_DIR / "favicon.ico")],
        check=True,
    )
    # Keep every live website entry point on the same canonical silhouette.
    shutil.copy2(gradient_svg, PROJECT / "public" / "adiviath-logo.svg")
    shutil.copy2(PNG_DIR / "symbol-gradient-1024.png", PROJECT / "public" / "adiviath-mark.png")
    shutil.copy2(favicon_svg, PROJECT / "public" / "favicon.svg")
    shutil.copy2(ICON_DIR / "favicon.ico", PROJECT / "public" / "favicon.ico")

    svg_names = [
        "favicon.svg",
        "profile-dark.svg",
        "profile-light.svg",
        "profile-cocoa.svg",
        "profile-cream.svg",
        "social-card.svg",
        "social-card-dark.svg",
        "social-card-light.svg",
        "symbol-black.svg",
        "symbol-cocoa.svg",
        "symbol-flat.svg",
        "symbol-gradient-dark.svg",
        "symbol-gradient-light.svg",
        "symbol-gradient.svg",
        "symbol-purple.svg",
        "symbol-light.svg",
        "symbol-white.svg",
        "wordmark-black.svg",
        "wordmark-cocoa.svg",
        "wordmark-gradient-dark.svg",
        "wordmark-gradient.svg",
        "wordmark-light.svg",
        "wordmark-white.svg",
    ]
    manifest = {
        "approvedReference": "source/approved-reference.png",
        "master": "symbol-gradient.svg",
        "colors": {"dark": DARK, "purple": PURPLE, "orange": ORANGE, "white": WHITE},
        "svg": svg_names,
        "png": sorted(path.name for path in PNG_DIR.glob("*.png")),
        "icons": sorted(path.name for path in ICON_DIR.iterdir()),
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python3 scripts/finalize-logo.py /path/to/approved-reference.png")
    build(Path(sys.argv[1]).resolve())
