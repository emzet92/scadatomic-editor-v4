# Packaging fix

This corrected package includes two source files that were referenced by the patch but accidentally missing from the previous ZIP `files/` payload:

- `src/mock/mock-tag-simulator.ts`
- `src/uiframework/data/runtime/TagRuntimeProxy.ts`

The diff patches already contained these files; the defect affected copy-based installation from `files/`.
