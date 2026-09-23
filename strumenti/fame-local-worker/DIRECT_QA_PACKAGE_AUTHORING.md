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

## Pre-run checklist

Before freezing a new direct-QA package:

1. source snapshot must match the intended repository source exactly;
2. units must reconstruct the complete source;
3. headings without autonomous semantics must be joined to the following block;
4. each positive check must have explicit required coverage groups;
5. known harmless contextual units that may reasonably accompany evidence must be listed as benign context;
6. negative checks must not need evidence IDs;
7. package-specific tests must include incomplete coverage and false-positive authorization cases;
8. freeze package and rubric before the first model call.
