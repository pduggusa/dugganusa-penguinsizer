# The Install Map — `cable.html`

> Sizing-grade. Not an electrical stamp, not a mechanical stamp, not a quote.
> Confidence capped at 95%.

**A cabling breakout for standardized deployments.** It is not a second sizer and does not
try to be.

The sizer is **generic**: give it any GPU count, any architecture, any rack feed and it
sizes the pod and produces the BOM. That generality is the point of it and nothing here
changes it.

The install map is the opposite by design. It takes a **standardized deployment** — a
published reference architecture, built the way the vendor documents it — and breaks out the
part the sizer summarises: which U, which side, which zone, which bundle, which connector.
Generality is what you trade to get that detail, and it is a trade worth making exactly once
the deployment is standard.

So the two answer different questions and hand off cleanly:

| | Question | Scope |
|---|---|---|
| **Sizer** (`index.html`) | What do I buy, and does it fit the power and space I have? | Any architecture, any size |
| **Install map** (`cable.html`) | Where does it go, where does it plug in, what lands where? | Standardized deployments only |

One file, no CDN, no build step. It opens off a USB stick in a cold aisle with no network,
which is the room it was designed for.

---

## What it is for

Three audiences, one drawing:

| Reader | Question | Where the answer is |
|---|---|---|
| Electrical / facilities | Which feed, which zone, what happens when a zone drops | Power panel + the zone-loss verdict |
| Network / structured cabling | What leaves each rack, in what class, landing where | Bundle labels + the per-cabinet manifest |
| Smart hands on site | Which U, which side, which cord | The SVG export |

## The check that justifies the tool

Dual-corded equipment is not redundant because it has two cords. It is redundant because
the two cords land in **two things that cannot fail together**.

A row where every A feed hangs off one RPP and every B feed off another has two fault
zones. A row where eight racks tap the same busway section has **one**, however many PDUs
are bolted to it — and every steady-state drawing of that row looks fine.

So the map runs one check and reports it in words:

> **Lose any single zone.** Does every rack still have power, and does the surviving feed
> stay inside its breaker at 80% continuous?

A rack at 60% per feed passes every normal-day check and browns out the moment its partner
zone drops. Single-corded equipment in a lost zone is reported as **dropped**, because it is.

Set *Zone split* to **One zone** on the NVL72 preset and the verdict reads
`992.9 kW goes dark`. That is the entire argument for A/B, in one line, from your own numbers.

## Standardized deployments only — deliberately

There is no custom rack builder here, and that is the scope rather than a missing feature.
The value of a breakout is that it is **checkable against a published document**: a drawing
of a standard deployment can be wrong in a way somebody can catch, and a drawing of whatever
you typed cannot. Custom layouts are what the sizer is for.

The bar for adding a preset is therefore a published reference architecture with real
numbers in it — not a plausible-looking rack.

| Preset | Basis |
|---|---|
| **NVIDIA GB300 NVL72 — SpectrumX Enterprise RA** | [NVL72 AI Factory ERA](https://docs.nvidia.com/enterprise-reference-architectures/nvl72-ai-factory/latest/network-logical-architecture.html) |
| **Penguin Relion / Altus HGX B300** | Penguin datasheets, same NVIDIA HGX silicon |

Per SU (18 trays, 72 GPUs), matching the published figures:

- **144× 400G compute** — dual plane, 4 rails per plane, 18 uplinks per leaf per plane.
  Each tray carries four ConnectX-8 SuperNICs, dual-port 800G at 2×400G per port, so every
  GPU takes 2×400G, one to each plane.
- **36× 400G converged** — one BlueField-3 B3240 DPU per tray at 2×400G.
- **Management** — one run per tray in this model.

**The compute fabric is Ethernet, not InfiniBand.** This is the SpectrumX RA: SN5600 400G
leaves, SN5610 spines, RoCE. Quantum-X InfiniBand is a different reference architecture and
would carry different switches, different optics and different part numbers.

**Known gap, stated rather than papered over:** management shows one run per tray against
the document's 71× 1G per SU, which also counts switch, BMC and appliance management this
model does not yet enumerate. Compute and converged match the RA exactly; **management is a
floor, not a total.**

## What is published versus what is ours

The same rule as the rest of this repository: every number is either read from a vendor or
computed by us, and the difference travels with the number.

| Published | Ours |
|---|---|
| U-heights, tray counts, port topology, switch models | A/B side mapping per rack |
| Link counts per SU | Fault-zone assignment and the loss analysis |
| Rack input connectors per region (IEC 60309, NEMA) | Riser distance, slack policy, service loops |

**No vendor publishes which way round your PDUs go**, because it is a property of your hall,
not of their rack. Side mapping alternates by default — it balances tap load along a busway
and means a damaged vertical channel takes one feed from some racks rather than the same
feed from all of them. Change it to match the building.

## Power

Per-phase amps `= kW × 1000 ÷ (V × √3 × PF)`, breaker headroom at **80% continuous**.

**Feed pairs per rack is a control, not a constant.** One pair is correct for a 5–10 kW
enterprise rack and nonsense for a 132 kW GPU rack — nobody feeds that through one cord a
side. The NVL72 preset defaults to four pairs; per-feed load and failover both divide across
them. The first render of this tool showed 172 A landing on a 48 A limit and called it a
failure: the arithmetic was right and the model was wrong.

**Region drives voltage and the rack input connector**, because a kW figure is not something
anyone can order. Outlets are IEC 60320 (C13/C19) everywhere and do not vary; the input
connector and the supply voltage do.

## Cable lengths

Unchanged from the lengths-only version of this tool, and identical to the sizer's ladder —
the two must never quote different parts for the same run.

```
device→manager (400 mm each end) + rise to pathway + |rack A − rack B| × pitch
  + service loop each end  ×  slack factor  →  rounded UP to a stocked length
```

1U = 44.45 mm. Past the top of the ladder the answer is **"custom trunk — specify"**, not
">50 m", because that changes who you ring.

**Reach is not modelled here.** A 3 m passive DAC at 800G is a different animal from 3 m at
25G, and that argument belongs in the sizer, in one place. Pick the class you intend to
pull; this tells you how long it has to be.

The **riser leg** — the run off the row to the MDA or patch field — is a property of the
building and cannot be derived from the row. Tick the rack on its right edge, set the
distance on the 10 m slider. Counted once per run, not twice.

## Drawing conventions

Cross-rack runs **aggregate per rack, per class**, drawn once with a count — `180x`,
`18x` — the way NVIDIA's own reference figures draw them. A bundle is what physically leaves
the rack and a bundle is what gets pulled. 22 bundles carry all 1,692 runs on the 8-SU
preset, and the drawing states that rather than hiding a cap.

Same-rack runs stay per-U, because inside a cabinet the U is the useful information.

**The BOM always counts every individual run.** Bundling is a rendering decision, never a
data one.

## Exports

| Export | Shape | For |
|---|---|---|
| **SVG map** | Standalone, built from the model | Install teams. Opens in a browser, imports into Visio or Illustrator, prints. |
| **XLS workbook** | SpreadsheetML 2003, three sheets | BOM · cable schedule · power and zones, including the zone-loss table and the arithmetic basis. |

The workbook is hand-built XML rather than a library, so the page keeps its one-file,
no-CDN, works-offline property. Three sheets because the reader is three different people.
