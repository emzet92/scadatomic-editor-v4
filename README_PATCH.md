# SCADAtomic semantic Code Graph patch

Base: `scadatomic-editor-execution-plan-source.zip`

This patch changes only the **Code Graph** visualization. Execution Plan and Execution Graph semantics remain unchanged.

## Apply

Preferred:

```bash
patch -p1 < PATCH_SEMANTIC_CODE_GRAPH.diff
```

or copy the included `src/...` files into the project. The diff also removes the old `AstGraphView.tsx`, which has been replaced by `CodeGraphView.tsx`.

See `SEMANTIC_CODE_GRAPH.md` for the architecture and file locations.
