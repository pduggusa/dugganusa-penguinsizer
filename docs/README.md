# Documentation

Four documents. Read them in this order if you are new; jump straight to the one you need if you are not.

| Document | Answers |
|---|---|
| **[USING-THE-SIZER.md](USING-THE-SIZER.md)** | How do I actually drive this thing? Step by step, tab by tab. |
| **[MODEL-AND-FLOW.md](MODEL-AND-FLOW.md)** | How does a GPU target become a floor plan? What decides nodes per rack? |
| **[BUSINESS-RULES.md](BUSINESS-RULES.md)** | What does it refuse to let you build, and on what authority? All 21 rules. |
| **[BOM-AND-ORDERING.md](BOM-AND-ORDERING.md)** | What comes out the other end, and how does it reach a purchase order? |

## The one idea underneath all four

Every number in this tool is either **read from a vendor** or **computed by us**, and the
difference is carried on the number itself — not in a footnote, not in a disclaimer at the
bottom of a page.

That sounds like a documentation convention. It is actually the central engineering
constraint, and it is enforced by code:

- `archSpec().provenance` is `vendor` or `derived` and rides on every downstream figure
- basis strings say `DERIVED (OURS)` in words, so the XLSX styler colours them amber and a
  reader scanning a spreadsheet cannot mistake them
- rule **V1** fails the build if any BOM line cites an NVIDIA reference-architecture table
  on a fabric we computed ourselves
- rule **V2** states, on the face of every derived build, that our arithmetic is not a
  vendor-blessed validated configuration

The reason for all of it is one specific failure mode: NVIDIA publishes the GB300 NVL72
scalable unit and RA Tables 3 and 4, and publishes **nothing equivalent** for a Penguin
Relion or an Altus. A tool that quietly reuses NVIDIA's numbers for a Penguin build and
prints Penguin's name on the result has laundered somebody else's reference architecture
into a quote. That is worse than being wrong, because it is wrong with a citation.

## Scope, honestly

**Sizing-grade.** It informs a conversation. It is not a quote, not an electrical stamp,
not a mechanical stamp, and confidence is capped at 95% on purpose.

It does not model containment, CRAC/CRAH placement, plenum depth or recirculation, and no
part of it is a CFD result. It does not know your floor plan or your structural loading —
a populated GB300 NVL72 rack is roughly 1,500 kg, which is a structural question in many
buildings before it is a networking one.
