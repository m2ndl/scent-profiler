# One-off edit (29 Sep 2026): the verifier's fixes outside landing.js and landing.css.
import pathlib, sys
ROOT = pathlib.Path("C:/Users/malha/Desktop/Webapps/perfume-profiler")
EDITS = {
    "site/index.html": [
        ('content="Perfumes are made of pleasant materials, yet few suit any one person. A short quiz finds the notes that spoil perfumes for you and the scents you especially love. Arabic and English."',
         'content="One note you cannot stand can spoil a perfume. A short quiz in Arabic and English finds the notes that spoil perfumes for you and the scents you especially love."'),
    ],
    "site/js/quiz.js": [
        # the amber tip, which still made the last hours the stage that matters
        ('tip: "These materials carry a perfume\'s last hours, so judge an amber sample hours after you put it on, not at the counter." },',
         'tip: "These materials last longest on skin, so judge an amber sample over several hours, not only at the counter." },'),
        ('tip: "هذه المواد تحمل الساعات الأخيرة من العطر، فاحكم على عيّنة العنبر بعد ساعات من وضعها، لا في المتجر." },',
         'tip: "هذه المواد تدوم أطول من غيرها على الجلد، فاحكم على عيّنة العنبر على مدى ساعات، لا في المتجر فقط." },'),
        # opened from the front page, the quiz counts its start screen as reached there, so Back does not send it again
        ('if (new URLSearchParams(location.search).has("go")) { hist.push(snap()); step = "grid"; }',
         'if (new URLSearchParams(location.search).has("go")) { sent.add("reach:start"); hist.push(snap()); step = "grid"; }'),
    ],
    "site/js/data.js": [
        # the Arabic heart lists now match the English ones word for word, so the pages can show them in Arabic
        ('ar:"جريب فروت، ليمون، نعناع، فلفل وردي / زنجبيل، جوزة الطيب، ياسمين / بخور، عنبر، أرز، صندل، باتشولي"',
         'ar:"جريب فروت، ليمون، نعناع، فلفل وردي / زنجبيل، جوزة الطيب، ياسمين، إيزو إي سوبر / بخور، عنبر، أرز، صندل، باتشولي"'),
        ('ar:"ليم، ليمون، برغموت، يوسفي، نيرولي / نفحات بحرية، ياسمين، خوخ، إكليل الجبل / مسك أبيض، أرز، طحلب، باتشولي، عنبر"',
         'ar:"ليم، ليمون، برغموت، يوسفي، نيرولي / نفحات بحرية، ياسمين، كالون، خوخ، فريزيا، إكليل الجبل / مسك أبيض، أرز، طحلب، باتشولي، عنبر"'),
    ],
    "tools/build_artifact.py": [
        ('''(out / "js" / "bottles.js").write_text("window.PP_BOTTLES = " + json.dumps(bottles, separators=(",", ":")) + ";\\n", encoding="utf-8")''',
         '''(out / "js" / "bottles.js").write_text("window.PP_BOTTLES = " + json.dumps(bottles, separators=(",", ":")) + ";\\n", encoding="utf-8")
# the front page's twenty photos are named by path in js/landing-data.js; the host serves no img/ folder, so they
# travel inside that file as data URIs too
landing = (out / "js" / "landing-data.js").read_text(encoding="utf-8")
for ref in sorted(set(re.findall(r'"(img/bottles/[^"]+\\.webp)"', landing))):
    landing = landing.replace(f'"{ref}"', '"data:image/webp;base64,' + base64.b64encode((site / ref).read_bytes()).decode("ascii") + '"')
(out / "js" / "landing-data.js").write_text(landing, encoding="utf-8")'''),
    ],
    "README.md": [
        ("paper test strips for eight families with how many perfumes use each; a perfume's notes, one of which the visitor marks as the one they would mind; a day of wear across the three stages.",
         "paper test strips for ten families with how many perfumes clearly carry each, and the critics' star count; a 100-person grid per smell from a large smell survey; a perfume's notes, one of which the visitor marks as the one they would mind; a day of wear across the three stages. Its facts from the books carry their sources on the page."),
    ],
    "site/articles.html": [
        ('<meta property="og:title" content="Why the drydown ruins it · لماذا يتغيّر العطر بعد ساعات؟">',
         '<meta property="og:title" content="Why a perfume can turn on you · لماذا قد ينقلب العطر عليك؟">'),
        ('<title>Why the Drydown Ruins It</title>', '<title>Why a Perfume Can Turn on You</title>'),
        ('h1: "Why the drydown ruins it",', 'h1: "Why a perfume can turn on you",'),
        ('lede: "Four short pieces on the part of a perfume nobody tests at the counter: the base that is still on your skin six hours later.",',
         'lede: "Four short pieces on materials that divide people, and on reading what a perfume box tells you.",'),
        ('h1: "لماذا يتغيّر العطر بعد ساعات؟",', 'h1: "لماذا قد ينقلب العطر عليك؟",'),
        ('lede: "أربع مقالات قصيرة عن الجزء الذي لا يختبره أحد عند الطاولة: القاعدة التي تبقى على جلدك بعد ست ساعات.",',
         'lede: "أربع مقالات قصيرة عن مواد يختلف فيها الناس، وعن قراءة ما تخبرك به علبة العطر.",'),
    ],
}
for rel, pairs in EDITS.items():
    path = ROOT / rel
    s = path.read_text(encoding="utf-8")
    for old, new in pairs:
        n = s.count(old)
        if n != 1:
            sys.exit(f"{rel}: expected one match, found {n}: {old[:80]}")
        s = s.replace(old, new)
    path.write_bytes(s.encode("utf-8"))
    print(f"{rel}: {len(pairs)} replacements")
