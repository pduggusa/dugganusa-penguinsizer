# AI Factory Sizer — Blackwell / SuperPOD

> **BETA.** Sizing-grade estimates to inform a conversation — not a quote, not an
> electrical stamp, not a mechanical stamp. Confidence capped at 95%.
> **Source-available under [BUSL 1.1](LICENSE).** Free for sizing your own
> infrastructure. Paid if you are being paid — see **[COMMERCIAL.md](COMMERCIAL.md)**.

Interactive capacity planner for **sovereign, compliant, on-prem AI factories** built on NVIDIA Blackwell.
Size a GPU cluster across four architectures from any single target — GPUs, FP4 exaFLOPS, SuperPODs, or nodes —
and derive **power (space- vs power-limited racks), cost/TCO, storage, and flagship-model workloads** live.

## Architectures
- **NVIDIA GB300 NVL72** — rack-scale, SuperPOD building block (72 B300 + 36 Grace / rack)
- **NVIDIA DGX B300** — HGX 8-GPU node (10U)
- **Penguin Solutions Relion XE4418GT** — Intel Xeon 6 + B300 HGX (4U, direct-to-chip liquid)
- **Penguin Solutions Altus XE4318GTS** — AMD EPYC Turin + B200 HGX (4U, direct-to-chip liquid)

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

Exports: multi-sheet XLSX workbooks, CSV and JSON, with a provenance block naming what is
vendor-published, what we derived, and what nobody has published.

## Provenance
Anchored to public NVIDIA reference-architecture, Penguin, VAST and Dell datasheets (2026).
FP4 = dense (sparse ≈ 2×). Every figure is labelled **vendor** / **ours** / **not published** —
see the References tab and **[NOTICE.md](NOTICE.md)**. Estimates, not a quote.

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
