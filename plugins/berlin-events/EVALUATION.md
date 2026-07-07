# Berlin Events Extraction Evaluation

This records the live-web comparison used to evaluate PR #27 against `origin/main`.

## Method

The comparison ran both branches in isolated `/tmp` worktrees against the same 11 Berlin
event sources. It did not use or mutate the user's qurl database.

Score formula:

```text
+1 successful command exit
+1 output contains event/date signal
+1 successful non-consent output >= 300 bytes
-2 consent-only output
```

## Results

| Branch | Score | Success | Event signal | Consent-only | Total bytes |
|---|---:|---:|---:|---:|---:|
| `origin/main` | 28 | 11/11 | 10/11 | 1 | 120,311 |
| PR #27 | 30 | 10/11 | 10/11 | 0 | 133,847 |

| Source | Main score | PR #27 score | Main bytes | PR #27 bytes | Main sec | PR #27 sec | Notes |
|---|---:|---:|---:|---:|---:|---:|---|
| indexberlin | 3 | 3 | 34,903 | 34,885 | 1.59 | 1.83 | Tie |
| kw-berlin | 3 | 3 | 22,389 | 22,389 | 1.29 | 1.28 | Tie |
| berlinischegalerie | 3 | 3 | 6,758 | 6,758 | 0.94 | 1.11 | Tie |
| artatberlin | 3 | 3 | 3,802 | 3,802 | 0.85 | 1.04 | Tie |
| co-berlin | 3 | 3 | 3,880 | 3,880 | 1.28 | 1.34 | Tie |
| kunstleben | 3 | 3 | 29,546 | 29,515 | 3.21 | 3.33 | Tie |
| berlin-de | 3 | 3 | 3,413 | 3,413 | 0.51 | 0.69 | Tie |
| visitberlin | 3 | 3 | 13,735 | 13,735 | 1.36 | 0.97 | Tie |
| tip-berlin | 3 | 3 | 1,507 | 1,507 | 0.72 | 9.11 | Same useful output; PR is slower because it uses Playwright |
| gropius-bau | 2 | 3 | 87 | 13,867 | 0.82 | 8.41 | PR extracts rendered event content instead of address/navigation text |
| mitvergnuegen | -1 | 0 | 291 | 96 stderr | 0.90 | 8.48 | PR rejects consent-only output instead of ingesting it |

## Conclusion

PR #27 improves extraction quality while preserving the useful Readability path for sources
that already worked on `main`. The practical wins are:

- Gropius Bau changes from address/navigation noise to rendered event content.
- Mit Vergnuegen consent text is rejected rather than treated as a successful extraction.
- Existing static sources produce equivalent output.

The trade-off is speed: Playwright-backed sources are slower than static Readability fetches.
