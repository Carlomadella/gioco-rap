# Direct QA package authoring rules

## Semantic unit rule

Evidence units must represent complete semantic blocks.

Do not split a structural Markdown heading into its own evidence unit when it only labels the paragraph/list that follows. In that case, combine the heading and its following content into one unit.

Bad:

```text
U13: ## Ricerca per il prossimo ramo
U14: Tsumugi: ...
```

Preferred:

```text
U13: ## Ricerca per il prossimo ramo

Tsumugi: ...
```

Reason: the model may reasonably cite the heading together with the content. If the heading is a standalone unit but is neither required nor declared benign context, the host validator can produce a precision false negative even when the conclusion and required coverage are correct.

## Frozen-run rule

Never repair a consumed task by changing its rubric/package and rerunning it. Preserve the historical result, classify the authoring defect separately, and apply the improved unitization only to new task IDs.

## Benign-context rule

For every positive check, classify before the first model call not only the
minimum evidence required for coverage, but also any other unit that a careful
reviewer could reasonably cite as contextual support without changing the
conclusion.

Use `benignContext` only for evidence that is relevant but unnecessary.
Do not use it as a wildcard for arbitrary extra citations.

A useful pre-freeze test is:

- if the required evidence were already present, would citing this additional
  unit still be defensible as context for the exact assertion?
- if yes, consider freezing it as `benignContext`;
- if no, leave it unreviewed so the validator can still reject evidence drift.

Do not change `benignContext` after observing a consumed run in order to turn a
historical reject into a PASS. Apply improved context classification only to new
task IDs.

## Required-group non-duplication rule

Each required coverage group must correspond to a genuinely distinct semantic
obligation in the assertion.

Do not require two separate units merely because both restate or reinforce the
same fact. If one complete semantic unit already supports every part of the
assertion, a second unit containing the same substance must not become another
mandatory group.

Before freezing a positive check, perform this test for every required group:

1. identify the exact clause of the assertion that the group is necessary for;
2. remove that group while keeping the other required groups;
3. ask whether any part of the assertion is now unsupported;
4. if no part becomes unsupported, the group is redundant and should be an
   alternative, benign context, or omitted.

This classification must be made before the first model call. Do not remove a
redundant group retroactively from a consumed package to convert a historical
reject into a PASS.

## Pre-run checklist

Before freezing a new direct-QA package:

1. source snapshot must match the intended repository source exactly;
2. units must reconstruct the complete source;
3. headings without autonomous semantics must be joined to the following block;
4. each positive check must have explicit required coverage groups;
5. known harmless contextual units that may reasonably accompany evidence must be listed as benign context;
6. benign context must be relevant to the exact assertion, not a wildcard for extra evidence;
7. negative checks must not need evidence IDs;
8. every required coverage group must map to a distinct necessary clause of the assertion;
9. package-specific tests must include incomplete coverage, false-positive authorization and unreviewed-evidence cases;
10. freeze package, rubric and benign-context classification before the first model call.
