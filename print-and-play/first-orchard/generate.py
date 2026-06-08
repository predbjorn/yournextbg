#!/usr/bin/env python3
"""
Print-and-play generator for FIRST ORCHARD — a homemade tribute to HABA's
cooperative toddler classic (BGG #41302).

Produces an A4, print-ready PDF with:
  - Cover + quick rules
  - Full rules / assembly page
  - 4 fruit trees (red apple, green apple, yellow pear, blue plum)
  - 16 punch-out fruit tokens
  - Fruit basket board
  - Raven + 5-step path (start nest -> orchard)
  - A fold-up colour-symbol die  +  a 24-card "roll deck" (no assembly needed)

Pure reportlab vector drawing: no external image assets, prints crisp at any size.
Run:  python3 generate.py
"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import Color
import math

OUT = "first-orchard-print-and-play-A4.pdf"
PW, PH = A4  # 210 x 297 mm in points

# ---- palette --------------------------------------------------------------
RED    = Color(0.83, 0.16, 0.16)
GREEN  = Color(0.32, 0.66, 0.27)
YELLOW = Color(0.96, 0.78, 0.16)
BLUE   = Color(0.24, 0.46, 0.80)
LEAF   = Color(0.30, 0.62, 0.26)
LEAFDK = Color(0.22, 0.50, 0.20)
TRUNK  = Color(0.47, 0.31, 0.18)
RAVEN  = Color(0.13, 0.13, 0.17)
BEAK   = Color(0.95, 0.62, 0.12)
INK    = Color(0.16, 0.16, 0.20)
SOFT   = Color(0.45, 0.45, 0.50)
BG     = Color(0.99, 0.98, 0.94)
PAPER  = Color(1, 1, 1)
BASKETC= Color(0.72, 0.50, 0.26)
BASKDK = Color(0.55, 0.37, 0.18)
CREAM  = Color(0.97, 0.95, 0.88)

FRUITS = [
    ("red",    RED,    "apple"),
    ("green",  GREEN,  "apple"),
    ("yellow", YELLOW, "pear"),
    ("blue",   BLUE,   "plum"),
]

# ---- low-level helpers ----------------------------------------------------

def rrect(c, x, y, w, h, r, fill=None, stroke=None, lw=1.2, dash=None):
    if fill: c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke); c.setLineWidth(lw)
    if dash: c.setDash(dash)
    else: c.setDash()
    c.roundRect(x, y, w, h, r, stroke=1 if stroke else 0, fill=1 if fill else 0)
    c.setDash()

def circle(c, cx, cy, rad, fill=None, stroke=None, lw=1.2):
    if fill: c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke); c.setLineWidth(lw)
    c.circle(cx, cy, rad, stroke=1 if stroke else 0, fill=1 if fill else 0)

def ellipse(c, cx, cy, rx, ry, fill=None, stroke=None, lw=1.2):
    if fill: c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke); c.setLineWidth(lw)
    c.ellipse(cx-rx, cy-ry, cx+rx, cy+ry, stroke=1 if stroke else 0, fill=1 if fill else 0)

def text(c, x, y, s, size=12, fill=INK, font="Helvetica", center=False, right=False):
    c.setFillColor(fill); c.setFont(font, size)
    if center: c.drawCentredString(x, y, s)
    elif right: c.drawRightString(x, y, s)
    else: c.drawString(x, y, s)

def wrap(c, x, y, s, size, leading, width, font="Helvetica", fill=INK):
    c.setFont(font, size); c.setFillColor(fill)
    words = s.split(); line = ""
    for w in words:
        t = (line + " " + w).strip()
        if c.stringWidth(t, font, size) > width and line:
            c.drawString(x, y, line); y -= leading; line = w
        else:
            line = t
    if line: c.drawString(x, y, line); y -= leading
    return y

def lighten(col, f):
    return Color(col.red + (1-col.red)*f, col.green + (1-col.green)*f, col.blue + (1-col.blue)*f)

# ---- fruit + actor art (centered at cx,cy, sized by s in mm) --------------

def draw_apple(c, cx, cy, s, col):
    r = s*0.5
    circle(c, cx-r*0.42, cy, r*0.62, fill=col)
    circle(c, cx+r*0.42, cy, r*0.62, fill=col)
    circle(c, cx, cy-r*0.05, r*0.74, fill=col)
    # highlight
    circle(c, cx-r*0.35, cy+r*0.30, r*0.18, fill=lighten(col,0.55))
    # stem
    c.setStrokeColor(TRUNK); c.setLineWidth(max(1.4, s*0.05)); c.setLineCap(1)
    c.line(cx, cy+r*0.62, cx+r*0.06, cy+r*1.05)
    # leaf
    c.setFillColor(LEAF)
    c.ellipse(cx+r*0.05, cy+r*0.78, cx+r*0.55, cy+r*1.10, fill=1, stroke=0)

def draw_pear(c, cx, cy, s, col):
    r = s*0.5
    circle(c, cx, cy-r*0.30, r*0.72, fill=col)        # belly
    circle(c, cx, cy+r*0.45, r*0.42, fill=col)        # neck
    rrect(c, cx-r*0.42, cy-r*0.30, r*0.84, r*0.78, r*0.4, fill=col)
    circle(c, cx-r*0.28, cy-r*0.30, r*0.16, fill=lighten(col,0.55))
    c.setStrokeColor(TRUNK); c.setLineWidth(max(1.4, s*0.05)); c.setLineCap(1)
    c.line(cx, cy+r*0.85, cx, cy+r*1.12)
    c.setFillColor(LEAF)
    c.ellipse(cx+r*0.02, cy+r*0.92, cx+r*0.5, cy+r*1.18, fill=1, stroke=0)

def draw_plum(c, cx, cy, s, col):
    r = s*0.5
    ellipse(c, cx, cy, r*0.66, r*0.82, fill=col)
    # crease
    c.setStrokeColor(lighten(col,-0.0) if False else Color(col.red*0.7,col.green*0.7,col.blue*0.7))
    c.setLineWidth(max(1.2, s*0.04))
    c.line(cx, cy-r*0.7, cx, cy+r*0.7)
    ellipse(c, cx-r*0.24, cy+r*0.28, r*0.12, r*0.18, fill=lighten(col,0.55))
    c.setStrokeColor(TRUNK); c.setLineWidth(max(1.4, s*0.05)); c.setLineCap(1)
    c.line(cx, cy+r*0.80, cx+r*0.05, cy+r*1.02)
    c.setFillColor(LEAF)
    c.ellipse(cx+r*0.03, cy+r*0.80, cx+r*0.46, cy+r*1.04, fill=1, stroke=0)

def draw_fruit(c, cx, cy, s, col, kind):
    if kind == "apple": draw_apple(c, cx, cy, s, col)
    elif kind == "pear": draw_pear(c, cx, cy, s, col)
    else: draw_plum(c, cx, cy, s, col)

def draw_raven(c, cx, cy, s, walking=True):
    r = s*0.5
    # body
    ellipse(c, cx, cy, r*0.78, r*0.56, fill=RAVEN)
    # tail
    c.setFillColor(RAVEN)
    p = c.beginPath(); p.moveTo(cx-r*0.55, cy+r*0.10)
    p.lineTo(cx-r*1.15, cy+r*0.28); p.lineTo(cx-r*1.10, cy-r*0.06)
    p.lineTo(cx-r*0.55, cy-r*0.18); p.close(); c.drawPath(p, fill=1, stroke=0)
    # head
    circle(c, cx+r*0.55, cy+r*0.42, r*0.40, fill=RAVEN)
    # beak
    c.setFillColor(BEAK)
    p = c.beginPath(); p.moveTo(cx+r*0.88, cy+r*0.50)
    p.lineTo(cx+r*1.38, cy+r*0.40); p.lineTo(cx+r*0.90, cy+r*0.28); p.close()
    c.drawPath(p, fill=1, stroke=0)
    # wing
    c.setFillColor(Color(0.05,0.05,0.08))
    c.ellipse(cx-r*0.45, cy-r*0.18, cx+r*0.45, cy+r*0.34, fill=1, stroke=0)
    # eye
    circle(c, cx+r*0.62, cy+r*0.52, r*0.12, fill=PAPER)
    circle(c, cx+r*0.64, cy+r*0.52, r*0.055, fill=INK)
    # legs
    if walking:
        c.setStrokeColor(BEAK); c.setLineWidth(max(1.3,s*0.045)); c.setLineCap(1)
        c.line(cx-r*0.10, cy-r*0.50, cx-r*0.10, cy-r*0.80)
        c.line(cx+r*0.20, cy-r*0.50, cx+r*0.20, cy-r*0.80)

def draw_basket(c, cx, cy, s):
    w = s; h = s*0.78
    # handle
    c.setStrokeColor(BASKDK); c.setLineWidth(max(2,s*0.06))
    c.arc(cx-w*0.42, cy+h*0.02, cx+w*0.42, cy+h*0.95, startAng=20, extent=140)
    # body (trapezoid)
    c.setFillColor(BASKETC)
    p = c.beginPath()
    p.moveTo(cx-w*0.5, cy+h*0.18); p.lineTo(cx+w*0.5, cy+h*0.18)
    p.lineTo(cx+w*0.40, cy-h*0.5); p.lineTo(cx-w*0.40, cy-h*0.5); p.close()
    c.drawPath(p, fill=1, stroke=0)
    # rim
    rrect(c, cx-w*0.54, cy+h*0.12, w*1.08, h*0.16, h*0.08, fill=BASKDK)
    # weave lines
    c.setStrokeColor(BASKDK); c.setLineWidth(1)
    for i in range(1,5):
        yy = cy+h*0.10 - i*(h*0.12)
        c.line(cx-w*0.46+ i*0.5, yy, cx+w*0.46- i*0.5, yy)
    for dx in (-0.28,-0.10,0.10,0.28):
        c.line(cx+w*dx, cy+h*0.10, cx+w*dx*0.78, cy-h*0.48)

def draw_tree(c, x, y, w, h, name, col, kind):
    """Tree board with 4 fruit slots. (x,y) bottom-left, size w x h."""
    rrect(c, x, y, w, h, 8, fill=PAPER, stroke=lighten(col,0.0), lw=2.5)
    rrect(c, x+3, y+3, w-6, h-6, 6, stroke=lighten(col,0.55), lw=1)
    cx = x + w/2
    # trunk
    trunk_w = w*0.12
    c.setFillColor(TRUNK)
    c.rect(cx-trunk_w/2, y+10*mm, trunk_w, h*0.28, fill=1, stroke=0)
    # canopy: 3 overlapping leaf circles (kept clear of the top banner)
    canopy_cy = y + h*0.46
    cr = w*0.30
    for (dx,dy,rr) in [(-0.26,-0.02,0.86),(0.26,-0.02,0.86),(0,0.12,1.0)]:
        circle(c, cx+w*dx, canopy_cy+h*dy, cr*rr, fill=LEAF)
    circle(c, cx, canopy_cy+h*0.02, cr*1.02, fill=LEAFDK, stroke=None)
    circle(c, cx, canopy_cy+h*0.02, cr*0.97, fill=LEAF)
    # 4 fruit SLOTS where tokens are placed at setup
    slot_r = w*0.115
    spots = [(-0.22,0.12),(0.22,0.12),(-0.20,-0.16),(0.22,-0.14)]
    for (dx,dy) in spots:
        sx, sy = cx+w*dx, canopy_cy+h*dy
        circle(c, sx, sy, slot_r, fill=lighten(col,0.82), stroke=col, lw=1.4)
        draw_fruit(c, sx, sy, slot_r*1.5, lighten(col,0.45), kind)  # faint hint
    text(c, cx, y+5.5*mm, "place 4 fruit tokens here at setup",
         size=7.5, fill=SOFT, center=True)
    # colour banner LAST, so the title always sits on top of the canopy
    if name:
        rrect(c, x+8, y+h-19*mm, w-16, 13*mm, 4, fill=col)
        text(c, cx, y+h-12*mm, f"{name.upper()} TREE", size=12.5, fill=PAPER,
             font="Helvetica-Bold", center=True)

def draw_die_symbol(c, cx, cy, s, kind):
    """kind in {red,green,yellow,blue,basket,raven}"""
    if kind == "basket": draw_basket(c, cx, cy, s*0.9)
    elif kind == "raven": draw_raven(c, cx, cy, s*0.95, walking=False)
    else:
        for kk,col,fk in FRUITS:
            if kk==kind: draw_fruit(c, cx, cy, s, col, fk); break

# ---- page frame -----------------------------------------------------------

def page_bg(c):
    c.setFillColor(BG); c.rect(0,0,PW,PH, fill=1, stroke=0)

def header(c, title, sub=None):
    text(c, PW/2, PH-20*mm, title, size=24, fill=INK, font="Helvetica-Bold", center=True)
    if sub:
        text(c, PW/2, PH-27*mm, sub, size=10.5, fill=SOFT, center=True)
    c.setStrokeColor(lighten(INK,0.7)); c.setLineWidth(1)
    c.line(20*mm, PH-31*mm, PW-20*mm, PH-31*mm)

def cutline_note(c):
    text(c, PW/2, 9*mm, "Print at 100% (no 'fit to page').  Cut on solid lines · fold on dashed lines.",
         size=8, fill=SOFT, center=True)

# ===========================================================================
# PAGES
# ===========================================================================

def page_cover(c):
    page_bg(c)
    text(c, PW/2, PH-40*mm, "FIRST ORCHARD", size=40, fill=INK, font="Helvetica-Bold", center=True)
    text(c, PW/2, PH-50*mm, "a cooperative print-and-play harvest game",
         size=13, fill=SOFT, center=True)
    text(c, PW/2, PH-57*mm, "pick all the fruit before the hungry raven reaches the orchard!",
         size=11, fill=GREEN, font="Helvetica-Oblique", center=True)
    # component strip: the four fruits, the basket, the raven
    y = PH-92*mm
    xs = [PW*0.13, PW*0.27, PW*0.41, PW*0.55]
    for (nm,col,kind),xx in zip(FRUITS, xs):
        draw_fruit(c, xx, y, 22*mm, col, kind)
    draw_basket(c, PW*0.71, y, 28*mm)
    draw_raven(c, PW*0.88, y, 30*mm)
    text(c, PW/2, y-22*mm, "1–4 players   ·   ages 3+   ·   about 10–15 minutes",
         size=12, fill=INK, center=True)
    text(c, PW/2, y-30*mm, "everyone wins or loses together",
         size=11, fill=GREEN, font="Helvetica-Bold", center=True)
    # quick rules card
    bx, by, bw, bh = 25*mm, 28*mm, PW-50*mm, 78*mm
    rrect(c, bx, by, bw, bh, 8, fill=PAPER, stroke=lighten(INK,0.6), lw=1.5)
    text(c, bx+8*mm, by+bh-11*mm, "How to play in 20 seconds", size=14, font="Helvetica-Bold")
    lines = [
        "On your turn, roll the die (or flip the top roll-card):",
        "   • a fruit colour  →  take one of those fruits off its tree, into the basket",
        "   • the basket  →  take any one fruit you like",
        "   • the raven  →  move the raven forward one step on the path",
        "You are all one team. Win together if you collect ALL 16 fruits",
        "before the raven reaches the orchard. If the raven gets there first,",
        "the cheeky bird wins — so play again!",
    ]
    yy = by+bh-20*mm
    for ln in lines:
        bold = ln.strip().startswith("You are")
        text(c, bx+8*mm, yy, ln, size=10.5, font="Helvetica-Bold" if bold else "Helvetica")
        yy -= 7.5*mm
    text(c, PW/2, 16*mm, "A homemade tribute to HABA's First Orchard — made to print, cut, and play at the kitchen table.",
         size=8.5, fill=SOFT, center=True)
    c.showPage()

def page_rules(c):
    page_bg(c)
    header(c, "Assembly & full rules", "print · cut · play")
    colx = 22*mm
    y = PH-42*mm
    def h2(s):
        nonlocal y
        text(c, colx, y, s, size=13, font="Helvetica-Bold", fill=GREEN); y -= 7*mm
    def body(s):
        nonlocal y
        y = wrap(c, colx, y, s, 10, 5.6*mm, PW-44*mm); y -= 1.5*mm

    h2("What to print")
    body("Pages 3–7. Cardstock (160–250 g/m²) is ideal; plain paper works if you glue it to "
         "cereal-box card. Page 3 = the 4 trees. Page 4 = the 16 fruit tokens. Page 5 = the basket "
         "and the raven's path. Page 6 = a fold-up die. Page 7 = a 24-card 'roll deck' if you'd "
         "rather draw a card than fold a die (great for little fingers).")
    h2("Set up")
    body("1) Lay the 4 tree boards out where everyone can reach. "
         "2) Punch out the 16 fruit tokens and place 4 matching-colour fruits onto each tree's slots. "
         "3) Put the basket in the middle. "
         "4) Lay the 5 path cards in a row from the raven's nest to the orchard, and stand the raven "
         "on the nest (path card 1's left). "
         "5) Build the die (or shuffle the roll deck face-down).")
    h2("On your turn")
    body("Roll the die (or flip the top roll-card), then do what it shows:")
    for sym, label in [
        ("red","Take one RED apple off the red tree and drop it in the basket."),
        ("green","Take one GREEN apple off the green tree."),
        ("yellow","Take one YELLOW pear off the yellow tree."),
        ("blue","Take one BLUE plum off the blue tree."),
        ("basket","Lucky! Take ANY one fruit you like, from any tree."),
        ("raven","Uh-oh — move the raven forward one step along the path."),
    ]:
        draw_die_symbol(c, colx+5*mm, y-1.5*mm, 11*mm, sym)
        y = wrap(c, colx+13*mm, y, label, 10, 5.4*mm, PW-57*mm)
        y -= 2.0*mm
    body("If you roll a colour whose tree is already empty, that's fine — just pass the die to the "
         "next player. Then it's the next person's turn. Help each other and cheer!")
    h2("Winning & losing — together")
    body("If the team picks ALL 16 fruits before the raven arrives, you ALL win. "
         "If the raven reaches the orchard (it's standing past path card 5) while fruit is still on the "
         "trees, the raven wins this round — shuffle up and try again.")
    h2("Make it easier / harder")
    body("Easier (younger players): use 6 path cards instead of 5, and let the basket take TWO fruits. "
         "Harder (a real race): use only 4 path cards, and the basket takes just one fruit. "
         "Solo or two players works exactly the same — you simply take more turns each.")
    cutline_note(c)
    c.showPage()

def page_trees(c):
    page_bg(c)
    header(c, "The four fruit trees", "cut out · lay on the table · add 4 fruit tokens to each")
    # 2x2 grid
    m = 16*mm; gap = 8*mm
    aw = (PW - 2*m - gap)/2
    ah = (PH - 46*mm - 16*mm - gap)/2
    x0 = m; y_top = PH-46*mm
    coords = [(x0, y_top-ah), (x0+aw+gap, y_top-ah),
              (x0, y_top-2*ah-gap), (x0+aw+gap, y_top-2*ah-gap)]
    for (nm,col,kind),(x,y) in zip(FRUITS, coords):
        # cut border
        c.setStrokeColor(lighten(INK,0.55)); c.setLineWidth(1); c.setDash(2,2)
        c.rect(x-3, y-3, aw+6, ah+6, stroke=1, fill=0); c.setDash()
        draw_tree(c, x, y, aw, ah, nm, col, kind)
    cutline_note(c)
    c.showPage()

def page_tokens(c):
    page_bg(c)
    header(c, "The 16 fruit tokens", "cut out · place 4 of each colour on its tree")
    dia = 34*mm
    cols, rows = 4, 4
    gridw = cols*dia + (cols-1)*8*mm
    x0 = (PW-gridw)/2 + dia/2
    y0 = PH-58*mm
    # 4 of each colour, grouped by row
    idx = 0
    for r in range(rows):
        nm,col,kind = FRUITS[r]
        for cc in range(cols):
            cx = x0 + cc*(dia+8*mm)
            cy = y0 - r*(dia+10*mm)
            # cut circle
            c.setStrokeColor(lighten(INK,0.5)); c.setLineWidth(1); c.setDash(2,2)
            c.circle(cx, cy, dia/2+2, stroke=1, fill=0); c.setDash()
            circle(c, cx, cy, dia/2, fill=CREAM, stroke=col, lw=2)
            draw_fruit(c, cx, cy, dia*0.72, col, kind)
            idx += 1
        text(c, x0 - dia/2 - 6*mm, y0 - r*(dia+10*mm) - 1*mm, "", size=8)
    text(c, PW/2, 18*mm,
         "Tip: laminate or glue to thin card so they survive enthusiastic harvesting.",
         size=9, fill=SOFT, center=True)
    cutline_note(c)
    c.showPage()

def page_basket_path(c):
    page_bg(c)
    header(c, "Basket & the raven's path", "the basket holds picked fruit · the raven walks the path")
    # basket board (top)
    bx, by, bw, bh = 45*mm, PH-150*mm, PW-90*mm, 86*mm
    c.setStrokeColor(lighten(INK,0.5)); c.setLineWidth(1); c.setDash(2,2)
    c.rect(bx-3, by-3, bw+6, bh+6, stroke=1, fill=0); c.setDash()
    rrect(c, bx, by, bw, bh, 8, fill=PAPER, stroke=BASKDK, lw=2)
    text(c, bx+bw/2, by+bh-10*mm, "THE BASKET", size=13, font="Helvetica-Bold", center=True, fill=BASKDK)
    text(c, bx+bw/2, by+bh-17*mm, "put every picked fruit here — fill it with all 16 to win!",
         size=9.5, fill=SOFT, center=True)
    draw_basket(c, bx+bw/2, by+bh*0.30, 46*mm)
    # raven pawn token (cut out, stands/sits on the path)
    rty = by-26*mm
    rtr = 18*mm
    c.setStrokeColor(lighten(INK,0.5)); c.setLineWidth(1); c.setDash(2,2)
    c.circle(PW/2, rty, rtr+2, stroke=1, fill=0); c.setDash()
    circle(c, PW/2, rty, rtr, fill=CREAM, stroke=RAVEN, lw=2)
    draw_raven(c, PW/2, rty, rtr*1.7, walking=False)
    text(c, PW/2, rty-rtr-7*mm, "THE RAVEN  ·  cut out and start on the nest",
         size=9.5, fill=RAVEN, font="Helvetica-Bold", center=True)
    text(c, PW/2, rty-rtr-13*mm, "move it one step along the path each time you roll the raven",
         size=8.5, fill=SOFT, center=True)
    # path
    text(c, PW/2, by-66*mm, "THE PATH  (lay these 5 cards in a row)", size=12,
         font="Helvetica-Bold", center=True, fill=RAVEN)
    n = 5
    pw_ = 30*mm; gap = 4*mm
    tot = n*pw_ + (n-1)*gap
    px0 = (PW-tot)/2
    py = 30*mm; ph_ = 40*mm
    # nest label at far left, orchard at far right
    for i in range(n):
        x = px0 + i*(pw_+gap)
        c.setStrokeColor(lighten(INK,0.5)); c.setLineWidth(1); c.setDash(2,2)
        c.rect(x-2, py-2, pw_+4, ph_+4, stroke=1, fill=0); c.setDash()
        last = (i==n-1)
        rrect(c, x, py, pw_, ph_, 6, fill=(lighten(GREEN,0.75) if last else PAPER),
              stroke=lighten(INK,0.5), lw=1.4)
        # footprints
        c.setFillColor(lighten(INK,0.55))
        for fp in range(3):
            fy = py+ph_*0.30 + fp*(ph_*0.16)
            fx = x+pw_*0.5 + (-1 if fp%2 else 1)*pw_*0.12
            c.ellipse(fx-2.2, fy-3.2, fx+2.2, fy+3.2, fill=1, stroke=0)
        text(c, x+pw_/2, py+ph_-7*mm, str(i+1), size=14, font="Helvetica-Bold",
             center=True, fill=INK)
        if last:
            draw_tree(c, x+pw_*0.18, py+4, pw_*0.64, ph_*0.55, "", GREEN, "apple") if False else None
            text(c, x+pw_/2, py+5*mm, "ORCHARD", size=8, font="Helvetica-Bold",
                 center=True, fill=LEAFDK)
    # nest marker + raven token, drawn left of path
    text(c, px0-2*mm, py+ph_+6*mm, "START: raven's nest", size=8.5, fill=SOFT)
    text(c, px0+tot, py+ph_+6*mm, "raven reaches orchard = raven wins", size=8.5, fill=SOFT, right=True)
    cutline_note(c)
    c.showPage()

def page_die(c):
    page_bg(c)
    header(c, "The colour-symbol die", "cut out the cross · fold on dashed lines · tape into a cube")
    # cube net (cross): center column of 4 + 1 left + 1 right on second square
    e = 34*mm  # edge
    # net origin (bottom-left of the vertical strip of 4)
    nx = PW/2 - e/2
    ny = PH/2 - 2*e + 6*mm
    faces_vertical = ["red","green","yellow","basket"]   # bottom->top
    # vertical strip
    for i,kind in enumerate(faces_vertical):
        x = nx; y = ny + i*e
        c.setStrokeColor(INK); c.setLineWidth(1.2)
        c.rect(x, y, e, e, stroke=1, fill=0)
        draw_die_symbol(c, x+e/2, y+e/2, e*0.62, kind)
    # left + right faces attached to the 2nd-from-bottom square (green)
    yatt = ny + 1*e
    # left face = blue
    c.rect(nx-e, yatt, e, e, stroke=1, fill=0)
    draw_die_symbol(c, nx-e/2, yatt+e/2, e*0.62, "blue")
    # right face = raven
    c.rect(nx+e, yatt, e, e, stroke=1, fill=0)
    draw_die_symbol(c, nx+e+e/2, yatt+e/2, e*0.62, "raven")
    # fold lines (dashed) along internal edges
    c.setDash(3,2); c.setStrokeColor(SOFT); c.setLineWidth(0.9)
    for i in range(1,4):
        c.line(nx, ny+i*e, nx+e, ny+i*e)
    c.line(nx, yatt, nx, yatt+e)          # left fold
    c.line(nx+e, yatt, nx+e, yatt+e)      # right fold
    c.setDash()
    # glue tabs (simple trapezoid flaps) — drawn lightly as a hint on outer edges
    c.setStrokeColor(lighten(INK,0.5)); c.setLineWidth(0.8); c.setDash(2,2)
    tab = 6*mm
    # bottom of strip
    c.line(nx, ny, nx+e, ny)
    c.setDash()
    text(c, PW/2, ny-12*mm,
         "No glue? Tape the edges, or just use the Roll Deck on the next page instead.",
         size=9, fill=SOFT, center=True)
    text(c, PW/2, ny-20*mm,
         "Faces: red apple · green apple · yellow pear · blue plum · basket · raven.",
         size=9, fill=INK, center=True)
    cutline_note(c)
    c.showPage()

def page_rolldeck(c):
    page_bg(c)
    header(c, "Roll deck (no-fold alternative)", "cut into 24 cards · shuffle face-down · flip the top card on your turn")
    deck = []
    for kind in ["red","green","yellow","blue"]:
        deck += [kind]*4         # 16 fruit cards (4 each)
    deck += ["basket"]*4 + ["raven"]*4   # 8 action cards  -> 24 total, matches die odds
    cols, rows = 4, 6
    m = 16*mm
    cw = (PW-2*m)/cols
    ch = (PH-50*mm-12*mm)/rows
    x0 = m; y0 = PH-50*mm
    labels = {"red":"RED apple","green":"GREEN apple","yellow":"YELLOW pear",
              "blue":"BLUE plum","basket":"BASKET — any fruit","raven":"RAVEN — move it!"}
    for i,kind in enumerate(deck):
        r = i//cols; cc = i%cols
        x = x0 + cc*cw; y = y0 - (r+1)*ch
        c.setStrokeColor(lighten(INK,0.5)); c.setLineWidth(0.9); c.setDash(2,2)
        c.rect(x, y, cw, ch, stroke=1, fill=0); c.setDash()
        rrect(c, x+2, y+2, cw-4, ch-4, 5, fill=PAPER, stroke=lighten(INK,0.7), lw=1)
        draw_die_symbol(c, x+cw/2, y+ch*0.56, min(cw,ch)*0.50, kind)
        text(c, x+cw/2, y+5*mm, labels[kind], size=7.5, fill=INK, center=True, font="Helvetica-Bold")
    cutline_note(c)
    c.showPage()

def main():
    c = canvas.Canvas(OUT, pagesize=A4)
    c.setTitle("First Orchard — Print & Play")
    c.setAuthor("Made with Claude Code")
    page_cover(c)
    page_rules(c)
    page_trees(c)
    page_tokens(c)
    page_basket_path(c)
    page_die(c)
    page_rolldeck(c)
    c.save()
    print("wrote", OUT)

if __name__ == "__main__":
    main()
