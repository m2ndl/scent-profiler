import sys
p = 'C:/Users/malha/Desktop/Webapps/perfume-profiler/site/site.css'
s = open(p, encoding='utf-8').read()

def rep(a, b):
    global s
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b)

rep(""".wrap { max-width: 1120px; margin-inline: auto; padding-inline: 20px; padding-block: 0 96px; }
@media (max-width: 640px) { .wrap { padding-inline: 16px; } }""",
""".wrap { max-width: 1120px; margin-inline: auto; padding-inline: 16px; padding-block: 0 96px; }
@media (min-width: 641px) { .wrap { padding-inline: 20px; } }""")
rep(""".hero { padding-block: 44px 8px; max-width: 800px; }""",
""".hero { padding-block: 30px 8px; max-width: 800px; }
@media (min-width: 641px) { .hero { padding-block: 44px 8px; } }""")
rep(""".layout { display: grid; grid-template-columns: minmax(0, 1fr) 312px; gap: 48px; align-items: start; margin-top: 22px; }
@media (max-width: 900px) { .layout { grid-template-columns: minmax(0, 1fr); gap: 24px; } }""",
""".layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; align-items: start; margin-top: 18px; }
@media (min-width: 901px) { .layout { grid-template-columns: minmax(0, 1fr) 312px; gap: 48px; margin-top: 22px; } }""")
rep(""".strip { padding: 20px 22px 18px; background""", """.strip { padding: 16px 16px 14px; background""")
rep(""".timeline { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 18px; padding-top: 22px; }
.timeline::before { content: ""; position: absolute; top: 7px; inset-inline: 0; height: 3px; border-radius: 999px; background: linear-gradient(90deg, var(--open), var(--heart) 50%, var(--dry)); opacity: .9; }
[dir="rtl"] .timeline::before { background: linear-gradient(270deg, var(--open), var(--heart) 50%, var(--dry)); }
.stage { position: relative; }
.stage::before { content: ""; position: absolute; top: -22px; inset-inline-start: 0; width: 13px; height: 13px; border-radius: 50%; background: var(--paper); border: 2.5px solid var(--line-2); transform: translateY(1px); transition: background-color var(--ease), border-color var(--ease); }""",
"""/* the timeline runs down the phone screen and across a wider one; the line always fades opening to drydown */
.timeline { position: relative; display: grid; grid-template-columns: 1fr; gap: 14px; margin-top: 16px; }
.timeline::before { content: ""; position: absolute; top: 6px; bottom: 6px; inset-inline-start: 5px; width: 3px; border-radius: 999px; background: linear-gradient(180deg, var(--open), var(--heart) 50%, var(--dry)); opacity: .9; }
.stage { position: relative; padding-inline-start: 22px; }
.stage::before { content: ""; position: absolute; top: 4px; inset-inline-start: 0; width: 13px; height: 13px; border-radius: 50%; background: var(--paper); border: 2.5px solid var(--line-2); transition: background-color var(--ease), border-color var(--ease); }""")
rep("""@media (max-width: 640px) {
  .strip { padding: 16px 16px 14px; }
  .timeline { grid-template-columns: 1fr; gap: 14px; padding-top: 0; }
  .timeline::before { top: 6px; bottom: 6px; inset-inline: auto; inset-inline-start: 5px; width: 3px; height: auto; background: linear-gradient(180deg, var(--open), var(--heart) 50%, var(--dry)); }
  .stage { padding-inline-start: 22px; }
  .stage::before { top: 4px; inset-inline-start: 0; }
}""",
"""@media (min-width: 641px) {
  .strip { padding: 20px 22px 18px; }
  .timeline { grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 18px; padding-top: 22px; }
  .timeline::before { top: 7px; bottom: auto; inset-inline: 0; width: auto; height: 3px; background: linear-gradient(90deg, var(--open), var(--heart) 50%, var(--dry)); }
  [dir="rtl"] .timeline::before { background: linear-gradient(270deg, var(--open), var(--heart) 50%, var(--dry)); }
  .stage { padding-inline-start: 0; }
  .stage::before { top: -22px; transform: translateY(1px); }
}""")
rep(""".panel { position: sticky; top: 20px; background""", """.panel { position: relative; background""")
rep(""".bottombar { display: none; }
@media (max-width: 900px) {
  .panel { position: static; box-shadow: var(--shadow); }
  .bottombar { display: flex; position: fixed;""",
"""/* the phone gets a fixed summary bar within thumb reach; a wide screen gets the sticky side panel instead */
.bottombar { display: flex; position: fixed;""")
rep("""  .bottombar::before { content""", """.bottombar::before { content""")
rep("""  .bottombar a { color: var(--ground); font-weight: 600; text-decoration: none; padding: 6px 0; }
  .bottombar[hidden] { display: none; }
}""",
""".bottombar a { color: var(--ground); font-weight: 600; text-decoration: none; padding: 6px 0; }
.bottombar[hidden] { display: none; }
@media (min-width: 901px) {
  .panel { position: sticky; top: 20px; }
  .bottombar, .bottombar[hidden] { display: none; }
}""")
rep(""".toast { position: fixed; bottom: calc(16px + env(safe-area-inset-bottom, 0px));""", """.toast { position: fixed; bottom: calc(68px + env(safe-area-inset-bottom, 0px));""")
rep("""@media (max-width: 900px) { .toast { bottom: calc(68px + env(safe-area-inset-bottom, 0px)); } }""",
"""@media (min-width: 901px) { .toast { bottom: calc(16px + env(safe-area-inset-bottom, 0px)); } }""")
rep(""".qgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(156px, 1fr)); gap: 12px; margin-top: 22px; }""",
""".qgrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 20px; }
@media (min-width: 481px) { .qgrid { grid-template-columns: repeat(auto-fill, minmax(156px, 1fr)); gap: 12px; margin-top: 22px; } }""")
rep("""border-radius: 14px; padding: 16px 10px 14px; cursor: pointer; color: var(--ink); min-width: 0;""",
    """border-radius: 14px; padding: 14px 8px 12px; cursor: pointer; color: var(--ink); min-width: 0;""")
rep(""".qtile .thumb { width: 72px; height: 72px; border-radius: 10px; }""",
    """.qtile .thumb { width: 64px; height: 64px; border-radius: 10px; }
@media (min-width: 481px) { .qtile { padding: 16px 10px 14px; } .qtile .thumb { width: 72px; height: 72px; } }""")
rep("""@media (max-width: 480px) {
  .qgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .qtile { padding: 14px 8px 12px; }
  .qtile .thumb { width: 64px; height: 64px; }
}
""", "")
rep(""".qactions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 22px; }""",
"""/* on a phone the quiz's Continue stays within reach at the bottom of the screen while the grid scrolls */
.qactions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 22px; position: sticky; bottom: 0; z-index: 5; padding: 12px 0 calc(12px + env(safe-area-inset-bottom, 0px)); margin-bottom: -12px; background: linear-gradient(to top, var(--ground) 78%, transparent); }
@media (min-width: 901px) { .qactions { position: static; padding: 0; margin-bottom: 0; background: none; } }""")
rep(""".nrow { border: 1px solid var(--line); background: var(--paper); border-radius: var(--radius); padding: 12px 14px;""",
    """.nrow { border: 1px solid var(--line); background: var(--paper); border-radius: var(--radius); padding: 10px 12px;""")
rep(""".pcard { border: 1px solid var(--line); background: var(--paper); border-radius: var(--radius); padding: 12px 14px;""",
    """.pcard { border: 1px solid var(--line); background: var(--paper); border-radius: var(--radius); padding: 10px 12px;""")
rep("""@media (max-width: 480px) {
  .nrow, .pcard { padding: 10px 12px; }
  .nopts button { padding: 8px 2px; font-size: 12.5px; }
}""", """@media (min-width: 481px) { .nrow, .pcard { padding: 12px 14px; } }""")
rep("""border-radius: 8px; padding: 9px 3px; min-height: 42px; font-size: 13px; cursor: pointer; color: var(--ink-2); line-height: 1.2; overflow-wrap: anywhere;""",
    """border-radius: 8px; padding: 9px 2px; min-height: 44px; font-size: 12.5px; cursor: pointer; color: var(--ink-2); line-height: 1.2; overflow-wrap: anywhere;""")
rep(""".seg button:hover, .nopts button:hover {""",
    """@media (min-width: 481px) { .seg button, .nopts button { padding: 9px 3px; font-size: 13px; } }
.seg button:hover, .nopts button:hover {""")
open(p, 'w', encoding='utf-8', newline='\n').write(s)
import re
print("remaining max-width media queries:", re.findall(r'@media \(max-width[^)]*\)', s))
