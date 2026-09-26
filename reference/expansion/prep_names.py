"""Lists the chosen-so-far perfumes (full pyramid in cache/perfumes) that have no Arabic name yet, for the naming agent.
Writes names_todo.json: [{fid, house, name, sex}] in the catalogue's spelling of house and name.
python reference/expansion/prep_names.py"""
import glob, json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
designers = json.load(open(os.path.join(HERE, "fragrantica_designers.json"), encoding="utf-8"))
done = {}
for f in glob.glob(os.path.join(HERE, "ar_names_*.json")): done.update(json.load(open(f, encoding="utf-8")))
cards = {}
for f in glob.glob(os.path.join(HERE, "cache", "designers", "*.json")):
    page = os.path.basename(f)[:-5]
    for c in json.load(open(f, encoding="utf-8")) or []: cards[c["id"]] = (page, c)
todo = []
for f in sorted(glob.glob(os.path.join(HERE, "cache", "perfumes", "*.json"))):
    fid = int(re.search(r"_(\d+)(?:\.html)?\.json$", f).group(1))
    p = json.load(open(f, encoding="utf-8"))
    if not (p and p["top"] and p["middle"] and p["base"]) or str(fid) in done or fid not in cards: continue
    page, c = cards[fid]
    d = designers.get(f"/designers/{page}.html", page.replace("-", " "))
    t = c["title"]
    name = t[len(d) + 1:] if t.lower().startswith(d.lower() + " ") else t
    todo.append({"fid": fid, "house": d, "name": name, "sex": p["gender"]})
json.dump(todo, open(os.path.join(HERE, "names_todo.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(len(todo), "perfumes need an Arabic name")
