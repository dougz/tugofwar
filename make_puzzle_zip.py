#!/usr/bin/python3

import argparse
import os
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument("--debug", action="store_true")
options = parser.parse_args()

with zipfile.ZipFile("tugofwar.zip", mode="w") as z:
  with z.open("puzzle.html", "w") as f_out:
    with open("tugofwar.html", "rb") as f_in:

      html = f_in.read()

      if options.debug:
        head = ('<link rel=stylesheet href="/tugdebug/tugofwar.css" />'
                '<script src="/closure/goog/base.js"></script>'
                '<script src="/tugdebug/tugofwar.js"></script>')
      else:
        head = ('<link rel=stylesheet href="tugofwar.css" />'
                '<script src="tugofwar-compiled.js"></script>')

      html = html.replace(b"@HEAD@", head.encode("utf-8"))

      f_out.write(html)

  with z.open("solution.html", "w") as f_out:
    with open("solution.html", "rb") as f_in:
      f_out.write(f_in.read())

  with z.open("for_ops.html", "w") as f_out:
    with open("for_ops.html", "rb") as f_in:
      f_out.write(f_in.read())

  with z.open("metadata.yaml", "w") as f_out:
    with open("metadata.yaml", "rb") as f_in:
      f_out.write(f_in.read())

  if not options.debug:
    with z.open("tugofwar.css", "w") as f_out:
      with open("tugofwar.css", "rb") as f_in:
        f_out.write(f_in.read())

    with z.open("tugofwar-compiled.js", "w") as f_out:
      with open("tugofwar-compiled.js", "rb") as f_in:
        f_out.write(f_in.read())

