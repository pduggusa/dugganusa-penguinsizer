# AI Factory Sizer — Blackwell / SuperPOD

Interactive capacity planner for **sovereign, compliant, on-prem AI factories** built on NVIDIA Blackwell.
Size a GPU cluster across four architectures from any single target — GPUs, FP4 exaFLOPS, SuperPODs, or nodes —
and derive **power (space- vs power-limited racks), cost/TCO, storage, and flagship-model workloads** live.

## Architectures
- **NVIDIA GB300 NVL72** — rack-scale, SuperPOD building block (72 B300 + 36 Grace / rack)
- **NVIDIA DGX B300** — HGX 8-GPU node (10U)
- **Penguin Solutions Relion XE4418GT** — Intel Xeon 6 + B300 HGX (4U, direct-to-chip liquid)
- **Penguin Solutions Altus XE4318GTS** — AMD EPYC Turin + B200 HGX (4U, direct-to-chip liquid)

## Use it
Open `index.html`, or the hosted page (GitHub Pages). All economic/workload constants are editable —
drop real per-GPU capex and $/kWh to move from sizing-grade to procurement-grade.

Anchored to public NVIDIA reference-architecture + Penguin datasheets (2026). FP4 = dense (sparse ≈ 2×).
Estimates, not a quote.

_Built by DugganUSA LLC._
