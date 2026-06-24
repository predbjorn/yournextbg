# First Orchard — print & play

A homemade, print-at-home tribute to **HABA's _First Orchard_** ([BGG #41302](https://boardgamegeek.com/boardgame/41302/first-orchard)),
the cooperative "race the raven" game for little ones. Made for 1–4 players, ages 3+,
about 10–15 minutes. Everyone wins or loses together.

> This is a fan-made recreation for personal/home use, not the official product.
> If you enjoy it, support the original — HABA's edition has lovely chunky wooden fruit.

## Files

| File | What it is |
|---|---|
| `first-orchard-print-and-play-A4.pdf` | The whole game, 7 pages, A4, print-ready. **Start here.** |
| `png/page-*.png` | The same pages as 200 dpi PNGs, if you'd rather print images than a PDF. |
| `generate.py` | The generator (pure-Python `reportlab`). Re-run to tweak anything. |

## What's in the box (pages)

1. **Cover + 20-second rules**
2. **Assembly & full rules**
3. **The 4 fruit trees** — red apple, green apple, yellow pear, blue plum
4. **16 fruit tokens** (4 of each colour)
5. **The basket** + the **raven** pawn + the **5-step path**
6. **A fold-up colour-symbol die** (6 faces: 4 fruit colours, basket, raven)
7. **A 24-card "roll deck"** — use instead of the die if folding is fiddly

## How to print

- Print **at 100% / "actual size"** — turn OFF "fit to page" so the cut sizes stay right.
- **Cardstock** (160–250 g/m²) is best. On plain paper, glue the sheets to cereal-box card.
- Cut on the **solid** lines, fold on the **dashed** lines.
- Laminating the trees and tokens makes them last through many enthusiastic harvests.

## How to play

**Set up.** Lay out the 4 trees. Put 4 matching-colour fruit tokens on each tree.
Basket in the middle. Lay the 5 path cards in a row; stand the raven on its nest at the
start of the path. Build the die, or shuffle the roll deck face-down.

**On your turn,** roll the die (or flip the top roll-card):
- **a fruit colour** → take one fruit of that colour off its tree and put it in the basket
- **the basket** → take **any one** fruit you like, from any tree
- **the raven** → move the raven forward **one step** along the path

If you roll a colour whose tree is already empty, no worries — pass to the next player.

**Winning & losing — together.** If the team gets **all 16 fruits** into the basket before
the raven reaches the orchard, **everyone wins**. If the raven reaches the orchard (past
path card 5) first, the cheeky bird wins — shuffle up and play again.

**Make it easier:** use 6 path cards and let the basket take **two** fruits.
**Make it harder:** use only 4 path cards and the basket takes just one.

## Regenerating

```bash
pip install reportlab          # pure-Python, no system deps
python3 generate.py            # writes the A4 PDF
# optional PNGs (needs pymupdf):
pip install pymupdf
python3 - <<'PY'
import fitz
doc = fitz.open("first-orchard-print-and-play-A4.pdf")
names = ["1-cover","2-rules","3-trees","4-fruit-tokens","5-basket-and-path","6-die","7-roll-deck"]
for i, p in enumerate(doc):
    p.get_pixmap(dpi=200).save(f"png/page-{names[i]}.png")
PY
```
