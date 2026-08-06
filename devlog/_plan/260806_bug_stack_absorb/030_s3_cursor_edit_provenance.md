# 030 — s3: Cursor structured edit with real provenance (corrects #1036, closes #1017)

## What the contributor got right

ZachDreamZ built the whole conversion: `translateStructuredEditCall` validates the
JSON, resolves several argument spellings (`file_path` / `filePath` / `path` …),
builds line-based hunks, rejects final-newline-only and no-op edits, handles
`multi_edit` arrays, and **drops with an explanatory error rather than emitting a
best-effort patch**. That last choice is the right one and is most of the value
here. The synthetic tool descriptions are unusually good — they tell the model
that `old_string` must match exactly once, because `apply_patch` rejects ambiguous
hunks.

They also avoided shadowing: `cursorStructuredEditTools` filters out a candidate
whose bare name already exists in the client catalog. So the collision was
understood at injection time.

## The one decision to correct

That knowledge never reaches the translation. Both call sites gate on the name
alone:

```ts
const translation = translateStructuredEditCall(responsesName, normalizedArgs);  // stateless branch
const translation = translateStructuredEditCall(open.name, finalArgs);           // completion path
```

So a genuine client or MCP tool named `edit_file` is converted anyway — the exact
case the injection filter was written to avoid. The user either gets their call
silently re-emitted as `apply_patch`, or a drop error naming a conversion they
never requested.

**Do not derive provenance from `clientToolNames`.** A real client tool named
`edit_file` is in that set too; it is the collision, not the discriminator.

## Where provenance actually lives

The information exists at injection and must be carried forward:

1. `src/adapters/cursor/request-builder.ts:251-265` — `createCursorRequest()`
   filters the client catalog, then budgets. Compute the synthetic names from the
   ORIGINAL `visibleTools` here, and intersect with `budget.tools` afterwards so
   the set reflects what actually survived budgeting and was advertised.
2. `src/adapters/cursor/types.ts:10` — carry the list on `CursorRunRequest`.
3. `src/adapters/cursor/live-transport.ts:569-579` — seed the event state.
4. `src/adapters/cursor/protobuf-events.ts:127` — add the field:

```ts
  /**
   * Bare names advertised as OUR synthetic structured-edit tools on THIS request.
   * Provenance, not a name test: a client or MCP tool legitimately called
   * `edit_file` must pass through untranslated (#1036 review). Absent set = no
   * synthetic tools were advertised, so nothing converts.
   */
  syntheticStructuredEditToolNames?: ReadonlySet<string>;
```

Then both call sites become:

```ts
const translation = state.syntheticStructuredEditToolNames?.has(name)
  ? translateStructuredEditCall(name, args)
  : undefined;
```

The stateless fallback at `protobuf-events.ts:314` has no state by design (direct
and unit callers). It **defaults to pass-through**: no provenance, no conversion.
That is the fail-closed direction — an unconverted structured call is a visible,
recoverable failure; a wrongly converted one silently edits a file.

## Change map

- MODIFY `src/adapters/cursor/tool-definitions.ts` — take the PR's
  `CURSOR_EDIT_FILE_TOOL`, `CURSOR_MULTI_EDIT_TOOL`, schemas,
  `isCursorStructuredEditToolName`, `cursorStructuredEditTools` as written.
- MODIFY `src/adapters/cursor/protobuf-events.ts` — take
  `translateStructuredEditCall` and `dropStructuredEditCall` as written; add the
  state field; gate both call sites on it.
- MODIFY `src/adapters/cursor/request-builder.ts`, `types.ts`,
  `live-transport.ts` — thread the advertised-name set (this is the new work).
- NEW `tests/cursor-structured-edit.test.ts` — the PR's suite, PLUS the
  regression below.

## The regression test that would have caught this

**Corrected at audit.** A first draft of this test passed a plain
`{name, args}` object and looked for `type === "toolCall"`. Neither matches the
real surface: `mapSyntheticMcpExecToToolEvents` takes a protobuf `McpArgs` and
returns `tool_call_start` / `tool_call_delta` / `tool_call_end`
(`src/adapters/cursor/protobuf-events.ts:314-348`), and it returns `[]` unless
`providerIdentifier === OCX_RESPONSES_TOOL_PROVIDER` (`:319`). The draft would
have asserted on an empty array and passed for the wrong reason.

The contributor's own suite already builds these correctly, so reuse its shape —
encoded arg bytes, `providerIdentifier: "opencodex-responses"`, `toolCallId`:

```ts
  test("a client tool named edit_file is NOT converted when no synthetic tools were advertised (#1036 review)", () => {
    // Provenance, not name matching: an MCP server exposing `edit_file` must reach the
    // client untouched. Without the gate the user's call is either silently re-emitted
    // as apply_patch or dropped with an error naming a conversion they never requested.
    const args = create(McpArgsSchema, {
      name: CURSOR_EDIT_FILE_TOOL,
      toolName: CURSOR_EDIT_FILE_TOOL,
      toolCallId: "call_collision",
      providerIdentifier: "opencodex-responses",
      args: {
        file_path: encoder.encode(JSON.stringify("src/a.ts")),
        old_string: encoder.encode(JSON.stringify("x")),
        new_string: encoder.encode(JSON.stringify("y")),
      },
    });
    // State WITHOUT syntheticStructuredEditToolNames: the client owns this name.
    const state = createCursorProtobufEventState();
    state.clientToolNames = new Set([CURSOR_EDIT_FILE_TOOL]);

    const out = mapSyntheticMcpExecToToolEvents(args, "call_collision", { state });

    const start = out.find(m => m.type === "tool_call_start");
    expect(start?.name).toBe(CURSOR_EDIT_FILE_TOOL);
    expect(JSON.stringify(out)).not.toContain("*** Begin Patch");
  });
```

The stateful branch emits through `recordToolCall`/`commitToolCall`, so if the
observed event names differ from `tool_call_start` there, assert on whatever that
path emits and on the ABSENCE of `*** Begin Patch` — the second assertion is the
load-bearing one and is shape-independent.

## Red ablation

Remove the provenance gate at both call sites (restore the PR's name-only form).
The test above must fail with the call converted to `apply_patch`. Restore, it
passes, and the PR's own conversion tests stay green throughout — proving the gate
narrows behavior without breaking the feature.

If the test passes with the gate removed, it is not exercising the mapper — most
likely `providerIdentifier` or the arg encoding is wrong and the function returned
early. Fix the fixture before trusting the result.

## Verification

- `bun test tests/cursor-structured-edit.test.ts`
- `bun test tests/cursor-*.test.ts` (adapter suite unaffected)
- `bun run typecheck`

## Accept criteria

- Conversion happens only for provenance-tagged calls; stateless path passes through.
- The collision regression test present and proven red without the gate.
- `Closes #1017`; #1036 closed with attribution to ZachDreamZ, crediting the
  conversion logic and the drop-with-explanation design we kept wholesale.
