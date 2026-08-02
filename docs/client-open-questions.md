# Open questions from the content review

The client's `content-workbook.pdf` was audited against the original. **The clean,
self-consistent edits are implemented** (commit `713c982`). The items below are
**held** because they contradict something else, aren't final, or need a call the
brand has to make. Each lists the affected `field_id`s so the answer maps straight
back into the site.

---

## 1. "Five flavors" vs. six products  🔴 blocking
The copy was changed to **five** flavors, and **skewers** was annotated **"זה לא טעם"** ("not a flavor"):
- `meta.description`, `meta.home.description` → "חמישה טעמים / Five flavors" *(held)*
- `grid.kicker` → "חמישה טעמים יחודיים / five unique flavors" *(held)*

But the catalog has **six** products, the grid heading is **"הטעמים שלנו / Our Flavors"** showing all six, and the stats strip says **6 flavors** (that number lives in code, not the sheet). The hero already shows only the 5 pouches (skewers excluded).

**Decision needed:** treat skewers as a separate format (pull it out of the "Flavors" grid / give it its own section), or keep six and revert the copy to "six"? Whatever you choose, I'll align the grid, the SEO copy, and the "6 flavors" stat.

## 2. Kosher claim  🔴 blocking
`meta.description` now adds **"כשר. / Kosher."** - but **only** in the Google snippet; there's no kosher badge and it's not on the product pages. *(held)*

**Decision needed:** (a) Is the product **certified** (do you have a teudah)? We must not publish a kosher claim without one. (b) If yes, should it be site-wide (badge + product pages), not just the SEO description?

## 3. "לא צריך" = remove the element (not literal text)
These cells say **"לא צריך"** ("not needed"), which I read as *remove this label*, not *print the words "לא צריך"*:
- `stats.kicker` (was "למה זה עובד"), `process.kicker` (was "התהליך"), `testimonials.kicker` (was "מה אומרים"), `story.quoteAttribution` (was "Adin Human, מייסד").

**Confirm:** remove these four labels? (I'll hide them - the sections keep their main headings.)

## 4. Testimonials  🔴 not final
New reviews were written, but the section isn't shippable yet:
- `testimonials.tamar.quote` = **"תכתוב משהו מהלב…"** - a note-to-self, **not a real quote**. Needs the real text.
- `testimonials.noam.name`: HE **"יניב ה."** but EN still **"Noam S."** - mismatch.
- `testimonials.tamar.name`: EN left in Hebrew (**"מיכאל א."**, not transliterated).
- Tone is casual slang ("וואלה אח… מטורףףף", "ימניאק", "10 מ-10").

**Needed:** final, **real, attributable, consented** reviews (we can't publish invented ones), each with matching HE + EN and a transliterated EN name - plus confirmation the tone is intended. (`testimonials.kicker` removal is part of §3.)

## 5. Founder "Adin Human" - direction
The founder's name is being pulled back in some places but not all:
- `hero.eyebrow` "Adin Human" → **"Eat Like a Chef"** *(held)*
- `about.heading` "מאש, לא מפס ייצור" → **"Eat Like a Chef"** *(held)*
- `story.quote` reworded to a product claim + `story.quoteAttribution` removed *(held - §3)*
- **`story.p1` still names "Adin Human"**, and the brand is "The Heuman Chef by Adin Human".

**Decisions needed:** (a) De-emphasize the founder as above - confirm? (b) Keep "Adin Human" in the story paragraph? (c) If his name stays anywhere, **what's the Hebrew spelling** (הומן / יומן / other)? - still unanswered from the last round. (d) "Eat Like a Chef" would then appear in three spots (logo, hero eyebrow, About heading) - intended?

## 6. Consistency items (lower risk)
- **Same-day = "cross-country delivery"** (`checkout.methods.same_day.desc`, *implemented*): the delivery zones currently allow same-day **only in the center**. Reconcile the promise with the zones (I can widen same-day, or soften the copy).
- **"cherry wood" → "wood chips"**: applied where the client changed it (`product.cherryWood`, product descriptions), but a few HE spots (e.g. `story.p2`) still say "עצי דובדבן". Want it "שבבי עץ" everywhere?
- **`cart.remove` → "Return to smoker"** (*implemented*): this text is also the screen-reader label for the trash icon, so assistive tech will announce "return to smoker" for a remove button. Fine to keep, or want a clearer accessible label under the playful text?
- **EN edits I lightly corrected** so we don't ship broken English: `contact.body` ("A questions… a large orders…" → clean plural), heading capitalization/dashes, `meta` "Hand made"/"Hand crafted" unified to "Hand-crafted". Wording unchanged - flag if you'd rather keep verbatim.

## 7. Not in the workbook (still needs real data)
- **Stat numbers** - 12 hours, 100% natural, 34g protein, **6 flavors** - live in code, not the sheet. They're still placeholders, and "6 flavors" clashes with §1. Please provide real figures.
- **Nutrition table** per-100g values (energy/protein/fat/carbs/salt) are still placeholder lab numbers - same for every flavor.
- **Legal pages** (terms / privacy / shipping) are placeholder links.
