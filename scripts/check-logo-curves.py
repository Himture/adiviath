#!/usr/bin/env python3
"""Reject micro Bézier handles that render as dents in the master logo."""

import json
import math
import re
import sys
from pathlib import Path


paths_file = Path(__file__).resolve().parents[1] / "public" / "brand" / "source" / "paths.json"
mark = json.loads(paths_file.read_text(encoding="utf-8"))["mark"]
segments = [
    tuple(map(float, match))
    for match in re.findall(r"Q([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)", mark)
]

micro_handles = []
for index, (cx, cy, ex, ey) in enumerate(segments):
    control_to_end = math.dist((cx, cy), (ex, ey))
    if control_to_end < 1.75:
        micro_handles.append((index, "control-to-end", control_to_end))
    if index + 1 < len(segments):
        nx, ny, _, _ = segments[index + 1]
        end_to_control = math.dist((ex, ey), (nx, ny))
        if end_to_control < 1.75:
            micro_handles.append((index, "end-to-control", end_to_control))

if micro_handles:
    for index, side, length in micro_handles:
        print(f"dent risk: segment {index} {side} handle is {length:.2f}px")
    sys.exit(1)

print(f"logo curve check passed: {len(segments)} quadratic segments, no micro handles")
