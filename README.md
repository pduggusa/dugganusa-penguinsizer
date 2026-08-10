# AI Factory Sizer — Blackwell / SuperPOD

> **BETA.** Sizing-grade estimates to inform a conversation — not a quote, not an
> electrical stamp, not a mechanical stamp. Confidence capped at 95%.
> **Source-available under [BUSL 1.1](LICENSE).** Free for sizing your own
> infrastructure. Paid if you are being paid — see **[COMMERCIAL.md](COMMERCIAL.md)**.

Interactive capacity planner for **sovereign, compliant, on-prem AI factories** built on NVIDIA Blackwell.
Size a GPU cluster across four architectures from any single target — GPUs, FP4 exaFLOPS, SuperPODs, or nodes —
and derive **power (space- vs power-limited racks), cost/TCO, storage, and flagship-model workloads** live.

## Documentation

| | |
|---|---|
| **[docs/USING-THE-SIZER.md](docs/USING-THE-SIZER.md)** | How to drive it, tab by tab |
| **[docs/MODEL-AND-FLOW.md](docs/MODEL-AND-FLOW.md)** | How a GPU target becomes a floor plan |
| **[docs/BUSINESS-RULES.md](docs/BUSINESS-RULES.md)** | All 21 consistency rules and what they refuse |
| **[docs/BOM-AND-ORDERING.md](docs/BOM-AND-ORDERING.md)** | The BOM, its summary, and the `penguin-bom/1` order seam |

## Architectures
- **Penguin Solutions Relion XE4418GTS-DTC** — Intel Xeon 6 + B300 HGX (4U, direct-to-chip liquid)
- **Penguin Solutions Altus XE4318GTS-DTC** — AMD EPYC Turin + B200 HGX (4U, direct-to-chip liquid)
- **NVIDIA GB300 NVL72** — rack-scale, SuperPOD building block (72 B300 + 36 Grace / rack)
- **NVIDIA DGX B300** — HGX 8-GPU node (10U)
- **Dell PowerEdge XE9680L** — Intel Xeon 6 + B200 HGX (4U DTC) · **XE9712** — GB200 NVL72

Each is laid out **as itself**. Rack composition — nodes per rack, GPUs per rack, kW per
rack, port topology, rails — is read from the architecture and bounded by the rack feed you
select, so nodes per rack is `min(space, power)` and which one bound it is reported.

Architectures NVIDIA publishes no NVL72-style reference architecture for are **sized on
racks** rather than on an invented scalable unit, with every derived figure badged as ours.

That is a statement about our method, not about the vendor. **Penguin publishes the OriginAI
pod** — a 1/4-pod entry at 64 GPUs, pre-validated 1-pod / 4-pod / 16-pod configurations from
256 to 16,000+ GPUs, and a stated ceiling of 90+ pods and 24,000+ GPUs. This tool does not
model those boundaries yet, so a Penguin build here can land *between* pre-validated
configurations — rule **V2** says so on screen, by name. See
[MODEL-AND-FLOW.md](docs/MODEL-AND-FLOW.md).

## Partner Solutions — the rest of the floor
A real estate is not only an AI factory. The **Partner Solutions** tab sizes general-purpose
compute and storage on **Dell**: PowerEdge 17th-generation (R770/R670 Intel, R7725/R6725 AMD),
PowerStore / PowerMax / PowerFlex, and PowerSwitch fabric — driven by a **workload profile**
(OLTP, OLAP, SAP HANA, virtualization, VDI, HPC, CPU inference, or your own numbers) or by
**your current array's own counters**, and carried through power, cooling, cabling and racks.

Dell's **18th generation** is announced but carries no published power or thermal data, so the
tool lists it as a procurement calendar and **refuses to emit a wattage for it**. A percentage
performance claim is not a power figure.

## Use it
Open `index.html`, or the hosted page at **[penguinai.dugganusa.com](https://penguinai.dugganusa.com)**.
All economic/workload constants are editable — drop real per-GPU capex and $/kWh to move from
sizing-grade to procurement-grade.

Exports: multi-sheet XLSX workbooks, CSV and JSON, plus a **`penguin-bom/1`** BOM with
stable part ids, vendor, MPN, unit of measure and provenance — the shape an ordering system
consumes. See [BOM-AND-ORDERING.md](docs/BOM-AND-ORDERING.md).

## Consistency
21 rules run on every change and travel with the model into every export — rack load against
the feed at an 80% derate, leaf capacity and rail optimisation, optical and copper reach,
rack U, ASHRAE aisle minimums, and provenance. They report **PASS / WARN / FAIL**, and a
FAIL means the build is not quotable.

`scripts/assert-model-consistency.mjs` sweeps 48 configurations and then drives every rule
to FAIL on purpose, because a rule that cannot fail is decoration. It has already caught
four real defects, including one rule that could never have fired.

## Provenance
Anchored to public NVIDIA reference-architecture, Penguin, VAST and Dell datasheets (2026).
FP4 = dense (sparse ≈ 2×). Every figure is labelled **vendor** / **ours** / **not published** —
see the References tab and **[NOTICE.md](NOTICE.md)**. Estimates, not a quote.

NVIDIA publishes the GB300 NVL72 scalable unit and RA Tables 3/4, and publishes nothing
equivalent for a Penguin Relion or an Altus. Anything computed for those is ours and says
so — rule **V1** fails the build if any BOM line cites an NVIDIA RA table on a fabric we
derived, and rule **V2** states on the face of every derived build that our arithmetic is
**not a vendor-blessed validated configuration**. Penguin and Dell publish those; this tool
does not have that list. Confirm before it becomes a quote.

## Licensing at a glance
| You are | You pay |
|---|---|
| Sizing your **own** infrastructure | Nothing, ever |
| Using it in **billable client work** | [Practitioner $1,990/yr · Partner $49,500/yr](COMMERCIAL.md) |
| Running **one large buildout** | [Project licence, from $75,000](COMMERCIAL.md) |
| **Hosting, embedding or white-labeling** it | [OEM, from $250,000/yr](COMMERCIAL.md) |
| A **vendor** who wants their kit modelled properly | [Catalog integration, from $150,000](COMMERCIAL.md) |

Converts to **Apache 2.0** four years after publication. Full terms in [LICENSE](LICENSE);
copyright, beta status and trademark notices in [NOTICE.md](NOTICE.md).

_© 2026 DugganUSA LLC · Minnetrista, Minnesota · licensing@dugganusa.com_
