#!/bin/bash
# Gibt die nächsten 3 offenen Pakete aus und nimmt sie aus der Liste
F=${EP_Z:-/home/claude/fragen-en}/offen.txt; head -3 $F | tr '\n' ' '; echo; sed -i '1,3d' $F
