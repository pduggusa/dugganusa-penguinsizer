# Using these tools with an AI assistant

Prompts for working alongside an AI assistant on infrastructure sizing and installation
planning. They are written to be **generic** — no customer names, no site identifiers, no
account context — so they can be pasted into any assistant, shared with a colleague, or kept
in a runbook without review.

Two things make these useful rather than decorative:

1. **They ask for the denominator.** A number without its basis is not reviewable, and an
   assistant will happily produce a confident figure with no basis at all unless asked.
2. **They separate published from derived.** That distinction is the central constraint of
   these tools and it should survive contact with any assistant summarising their output.

---

## Establishing context

Paste this first when an assistant has no knowledge of the tools.

```
I am working with two infrastructure planning tools:

1. A generic AI-factory sizer. It turns a GPU target, an architecture and a rack feed
   into nodes, racks, PDUs, fabric and a bill of materials. Nodes per rack is
   min(space, power), and it reports which of the two bound the result.

2. A cabling breakout for standardized deployments. It takes a published reference
   architecture and produces a rack-elevation install map: device placement by U, A/B
   power with fault-zone analysis, cable bundles by class, and exports to SVG and XLS.

Both are sizing-grade — estimates to inform a conversation, not a quote and not an
electrical or mechanical stamp. Confidence is capped at 95%.

Every figure they produce is either read from a vendor document or computed by the tool,
and that distinction is carried on the figure. When you summarise or reason about their
output, preserve it: say which numbers are vendor-published and which are derived. If you
are unsure which a number is, say so rather than picking one.
```

---

## Reviewing a power design

```
Review this rack power design. For each point, state the arithmetic and the assumption
behind it rather than a verdict alone:

1. Per-phase current at the stated voltage and power factor, and the breaker headroom
   at 80% continuous.
2. Whether the design survives the loss of any single upstream fault zone — an RPP, a
   busway section, a UPS block. For each zone, what is the worst surviving feed, and
   does it stay within the breaker?
3. Any single-corded equipment, and what happens to it when its zone drops.
4. Whether the number of feed pairs is plausible for the rack density, or whether the
   design implies a failover the cords cannot carry.

Treat "two PDUs" as one fault zone unless the design says what is upstream of each.
Redundancy is a property of the upstream topology, not of the cord count.
```

## Sanity-checking a fabric topology against a reference architecture

```
I have a fabric topology and a vendor reference architecture. Compare them and report
differences as differences, not as errors — a deliberate deviation is legitimate and a
silent one is not.

For each of these, give the reference-architecture figure, the figure in my design, and
whether they agree:
- links per node or tray, and their speed
- number of planes and rails, and how a node distributes across them
- leaf and spine switch models, and uplinks per leaf per scalable unit
- links per scalable unit, by class (compute, converged/storage, management)

If the reference architecture states a figure I have not given you, say which one is
missing rather than inferring it. If my design implies a different fabric technology than
the reference architecture uses, flag that first — it changes the switches, the optics
and the part numbers.
```

## Preparing an installation handover

```
Turn this rack elevation and cable schedule into an installation brief for a technician
who has no prior context for this build.

Structure it per cabinet, because that is how the work happens:
- what physically goes in it, by U position and U height
- which side each power cord lands on, and which feed
- what cabling leaves the cabinet: how many, of what class, terminating where

Use counts and destinations rather than prose. State the total for each bundle. Do not
merge classes that are ordered separately.

Then list, separately, anything the drawing does not settle and that the installer will
have to ask about — rear-channel clearance, cable management, sequencing.
```

## Reviewing a cable bill of materials

```
Review this cable BOM for orderability. For each line:
- Is the class specific enough to order from? "Cable" and a length is not a part.
- Is the length a stocked length, or does it need a custom assembly?
- Do the quantities reconcile against the port counts in the topology?

Then tell me what is missing rather than only what is wrong — transceivers where a link
is optical, patch panels or trunks where a run crosses a field, power cords for every
supply in the design.

Where you cannot verify a quantity from what I have given you, say which input you would
need. Do not estimate it.
```

## Interrogating a sizing result

```
Here is the output of a sizing run. Before I act on it, help me find where it is weakest:

1. Which figures are vendor-published and which are derived by the tool?
2. Which single input, if wrong, moves the result most?
3. Where does the result sit against a physical limit — rack space, feed capacity,
   thermal envelope — rather than comfortably inside one?
4. What has the tool declined to compute, and why does that absence matter?

Rank by consequence if wrong, not by likelihood. I want to know what to verify first.
```

---

## Prompts to avoid

Three patterns produce confident output that cannot be checked. They are worth naming
because they are the natural way to ask.

**Asking for a number without its basis.** *"How many cables do I need?"* returns a figure
with no denominator. Ask for the arithmetic and the inputs alongside it.

**Asking an assistant to invent a reference architecture.** If a vendor has not published
one, the honest answer is to size on racks and badge the result as derived. An assistant
asked for "the standard layout" will produce a plausible one, and plausible is the failure
mode here.

**Asking whether a design is "redundant" or "safe".** Both compress a topology question
into a yes. Ask instead what happens when a specific thing fails — a named zone, a named
feed — and what the surviving path has to carry.
