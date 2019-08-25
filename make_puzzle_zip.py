#!/usr/bin/python3

import os
import zipfile

with zipfile.ZipFile("tugofwar.zip", mode="w") as z:
  with z.open("puzzle.html", "w") as f_out:
    with open("tugofwar.html", "rb") as f_in:
      f_out.write(f_in.read())

  with z.open("solution.html", "w") as f_out:
    with open("solution.html", "rb") as f_in:
      f_out.write(f_in.read())

  with z.open("for_ops.html", "w") as f_out:
    with open("for_ops.html", "rb") as f_in:
      f_out.write(f_in.read())

  with z.open("metadata.yaml", "w") as f_out:
    with open("metadata.yaml", "rb") as f_in:
      f_out.write(f_in.read())

  with z.open("tugofwar.css", "w") as f_out:
    with open("tugofwar.css", "rb") as f_in:
      f_out.write(f_in.read())

  with z.open("tugofwar.js", "w") as f_out:
    with open("tugofwar.js", "rb") as f_in:
      f_out.write(f_in.read())

