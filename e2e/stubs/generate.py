#!/usr/bin/env python3
"""Run once to regenerate stubs: python3 e2e/stubs/generate.py
Requires: python3-pillow, gstreamer1.0-plugins-ugly (x264enc), gstreamer1.0-plugins-good (vp8enc)
"""
import os
import subprocess
from PIL import Image

OUT = os.path.dirname(os.path.abspath(__file__))

def stub(filename):
    return os.path.join(OUT, filename)

# 1×1 red pixel images via Pillow
img = Image.new('RGB', (1, 1), (255, 0, 0))
img.save(stub('stub.jpg'), 'JPEG')
img.save(stub('stub.png'), 'PNG')
img.save(stub('stub.gif'), 'GIF')

# Single-frame videos via GStreamer
def gst(pipeline, out):
    cmd = f'gst-launch-1.0 -q {pipeline} ! filesink location={out}'
    subprocess.run(cmd, shell=True, check=True)

gst('videotestsrc num-buffers=1 ! videoconvert ! vp8enc ! webmmux', stub('stub.webm'))
gst('videotestsrc num-buffers=1 ! videoconvert ! x264enc ! mp4mux', stub('stub.mp4'))  # mp4mux places moov after mdat; fine for download tests, not for streaming playback

print(f'Stubs written to {OUT}/')
