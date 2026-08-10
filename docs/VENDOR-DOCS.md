# Vendor datasheets — Penguin Solutions GPU-accelerated servers

Every GPU platform Penguin publishes a datasheet for, as of **2026-08-10**, sourced from
[penguinsolutions.com/en-us/products/gpu-accelerated-servers](https://www.penguinsolutions.com/en-us/products/gpu-accelerated-servers).

**Links only, deliberately.** The datasheets are Penguin's copyrighted material and this is a
public repository — the same reason this tool draws its own faceplates instead of shipping
vendor stencil art. They are also not machine-fetchable: issuu returns 403 on the reader JSON
and every page image, and the viewer page carries no PDF URL.

Where a figure from one of these lands in the model, cite the row here rather than
restating it as ours. Anything the tool carries WITHOUT a citation here is sizing-grade and
rule V2 says so.

| Platform | Datasheet |
|---|---|
| Altus XE2318GTV2 | [issuu](https://issuu.com/penguinsolutions/docs/altus-xe2318gtv2-datasheet) |
| Altus XE3314GTSV2 | [issuu](https://issuu.com/penguinsolutions/docs/altus-xe3314gtsv2-datasheet) |
| Altus XE4318GTO Dtc | [issuu](https://issuu.com/penguinsolutions/docs/altus-xe4318gto-dtc-datasheet) |
| Altus XE4318GTS Dtc | [issuu](https://issuu.com/penguinsolutions/docs/altus-xe4318gts-dtc-datasheet) |
| Altus XE4318GTV2 | [issuu](https://issuu.com/penguinsolutions/docs/altus-xe4318gtv2-datasheet) |
| Altus XE5318GTO | [issuu](https://issuu.com/penguinsolutions/docs/altus-xe5318gto-gpu-datasheet) |
| Altus XE5318GTSV2 | [issuu](https://issuu.com/penguinsolutions/docs/altus-xe5318gtsv2-datasheet) |
| Altus XE8318GTO | [issuu](https://issuu.com/penguinsolutions/docs/altus-xe8318gto-datasheet) |
| Altus XE8318GTS | [issuu](https://issuu.com/penguinsolutions/docs/altus-xe8318gts-datasheet) |
| Altus XO1316GTO Dtc | [issuu](https://issuu.com/penguinsolutions/docs/altus-xo1316gto-dtc-datasheet) |
| Altus XE4318GTSV2 Dtc | [issuu](https://issuu.com/penguinsolutions/docs/altus_xe4318gtsv2-dtc-datasheet) |
| Altus XE8318GTSV2 | [issuu](https://issuu.com/penguinsolutions/docs/altus_xe8318gtsv2-datasheet) |
| Relion XE2318GT | [issuu](https://issuu.com/penguinsolutions/docs/relion-xe2318gt-gpu-datasheet) |
| Relion XE3314GTS | [issuu](https://issuu.com/penguinsolutions/docs/relion-xe3314gts-gpu-datasheet) |
| Relion XE4418GT | [issuu](https://issuu.com/penguinsolutions/docs/relion-xe4418gt-datasheet) |
| Relion XE5318GTO | [issuu](https://issuu.com/penguinsolutions/docs/relion-xe5318gto-gpu-datasheet) |
| Relion XE5318GTS | [issuu](https://issuu.com/penguinsolutions/docs/relion-xe5318gts-datasheet) |
| Relion XE8318GTS | [issuu](https://issuu.com/penguinsolutions/docs/relion-xe8318gts-datasheet) |
| Relion XE4318GT | [issuu](https://issuu.com/penguinsolutions/docs/relion_xe4318gt_gpu_-_datasheet) |
| Relion XE4418GTS Dtc | [issuu](https://issuu.com/penguinsolutions/docs/relion_xe4418gts-dtc-datasheet) |
| Relion XE8418GTS | [issuu](https://issuu.com/penguinsolutions/docs/relion_xe8418gts-datasheet) |

21 datasheets.

## The one we need and do not have

`Relion XE4418GTS-DTC` is the hero node in this sizer and its **system weight is not in the
model with a citation**. The built-in 100 kg/node carries no source; a reseller listing for the
comparable 4U 8-GPU Altus XE4218GTS gives ~59 kg unpopulated, which excludes the HGX
baseboard. That gap is the difference between a rack that passes a 1,220 kg/m² floor and one
that fails it — see rule **P2**. Open the datasheet above, and the node-weight override on the
Rack Planner takes the real number.
