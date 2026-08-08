# NOTICE — copyright, beta status, trademarks and provenance

**DugganUSA AI Factory Sizer**
**Copyright © 2026 DugganUSA LLC**, a Minnesota limited liability company.
All rights reserved except as granted by the [LICENSE](LICENSE) (BUSL 1.1).
Commercial terms: [COMMERCIAL.md](COMMERCIAL.md) · licensing@dugganusa.com

---

## 1. Beta

This is **pre-release software under active development**. Interfaces, numbers,
catalogs and export formats will change without notice.

Its outputs are **sizing-grade estimates**. They exist to inform a conversation
and to make the shape of a build visible early. They are explicitly **not**:

- a quotation or a price,
- an electrical stamp,
- a mechanical stamp,
- a substitute for a vendor sizing engagement,
- a substitute for a licensed professional engineer, or
- a CFD study.

Airflow uses `CFM = air BTU/hr ÷ (1.08 × ΔT°F)`, which assumes standard air
density and **understates airflow at altitude**. Loop flow uses
`L/min = kW × 60 ÷ (4.186 × ΔT°C)`, which is **water, not glycol**. Direct-to-chip
capture fractions are a band that moves with coolant temperature and flow.

**Confidence is capped at 95%.** Something in here is wrong. That is a statement
of method, not modesty — see the epistemic-humility posture that governs every
DugganUSA tool. Verify anything you are about to build from.

## 2. Copyright and originality

The Licensed Work is original to DugganUSA LLC.

- It has **no third-party runtime dependencies**. The application is a single
  self-contained HTML file with no external scripts, stylesheets, fonts or CDN
  requests. The Cloudflare Worker uses no packages.
- No third-party source code is embedded or vendored.
- **No vendor stencil artwork is used or redistributed.** Device faceplates are
  drawn from published port topologies and U-heights. VisioCafe and vendor Visio
  collections are their authors' copyrighted artwork and are not ours to ship —
  the tool lets you supply your own licensed stencils instead, and those never
  leave your browser.

## 3. Vendor specifications — what we transcribe and why that is lawful

The tool carries published hardware figures: PSU wattages, BTU/hr, rack-unit
heights, port counts, capacities, weights and dimensions.

**These are facts, not expression.** Individual specifications are not
copyrightable subject matter, and transcribing a wattage from a manufacturer's
published table is not infringement. What *is* ours — and what is licensed
above — is the selection, arrangement, engineering model, commentary, provenance
system and code around them.

We do not reproduce vendor spec sheets, datasheets, manuals or reference
architecture documents wholesale. We cite them and link to them so you can check
our transcription, which is the point.

Every figure in the tool is labelled with where it came from:

| Label | Meaning |
|---|---|
| **vendor** | The manufacturer published this. Cited on the References tab. |
| **ours / estimate** | We derived or assumed it. Editable, and it says so on its face. |
| **not published** | Nobody has published it. The tool refuses to invent one. |

That third category is load-bearing. Dell's 18th-generation PowerEdge line, for
example, is announced with availability dates and a performance claim but **no
per-model power or thermal data** — so the tool emits no wattage, no thermal load
and no rack count for it, and the exports refuse too. A percentage performance
claim is not a power figure.

**Stripping or altering these labels is a material breach of the License**
(Additional Use Grant, clause (d)). Presenting one of our estimates as a
vendor-certified number harms whoever builds from it.

## 4. Trademarks

All product names, logos and brands are property of their respective owners.
Use in the Licensed Work is **nominative** — to identify and describe the
products being sized — and does not imply affiliation, sponsorship or
endorsement.

**DugganUSA LLC is not affiliated with, endorsed by, or sponsored by** Dell
Technologies, NVIDIA, Penguin Solutions, VAST Data, Intel, AMD, SAP, ASHRAE, the
Open Compute Project, or any other organization referenced.

Marks referenced include, without limitation: Dell, Dell Technologies,
PowerEdge, PowerStore, PowerMax, PowerFlex, PowerSwitch, PowerRack, iDRAC and
OpenManage (Dell Technologies); NVIDIA, Blackwell, Grace, DGX, HGX, NVLink,
NVSwitch, BlueField, ConnectX, Quantum-X800, Spectrum-X, Vera Rubin and DCGM
(NVIDIA Corporation); Penguin Solutions, Relion, Altus, ClusterWareAI, MemoryAI
and ComputeAI (Penguin Solutions, Inc.); VAST Data and DASE (VAST Data Ltd.);
Xeon (Intel Corporation); EPYC (Advanced Micro Devices, Inc.); SAP and HANA (SAP
SE); ASHRAE (American Society of Heating, Refrigerating and Air-Conditioning
Engineers); and Open Compute Project / ORv3 (Open Compute Project Foundation).

"Business Source License" is a trademark of MariaDB Corporation Ab. The BUSL 1.1
license text is © 2020 MariaDB Corporation Ab.

## 5. Data you enter

The tool is a static page. Everything you type — workloads, array statistics,
site names, custom stencils — **stays in your browser** in `localStorage` and is
never transmitted to DugganUSA. The only outbound request is the optional AI
Factory Assistant chat, which sends the message you type to a DugganUSA-operated
Cloudflare Worker and on to a model provider. Do not paste confidential
customer data into the chat.

## 6. Not legal advice

This notice and the accompanying LICENSE were prepared by DugganUSA and have
**not been reviewed by counsel**. They are published in good faith and are
believed to be accurate, but they are not a legal opinion. If you are relying on
them for anything consequential — particularly the commercial-use boundary or
the trademark position — have your own lawyer read them.

---

*Report an attribution error, a mis-transcribed figure, or a trademark concern:
licensing@dugganusa.com. Corrections ship faster than complaints.*
