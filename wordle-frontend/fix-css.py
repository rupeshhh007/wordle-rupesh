import os

with open("src/app/globals.css", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
in_theme = False
for line in lines:
    if "@theme inline {" in line:
        in_theme = True
    if "}" in line and in_theme:
        in_theme = False
        
    if in_theme and "/*" in line:
        continue
    new_lines.append(line)

with open("src/app/globals.css", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
