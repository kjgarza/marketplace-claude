---
name: metaprompt
description: This skill should be used when the user wants to turn a plain-English task description into a reusable prompt template with {$VARIABLE} placeholders, using Anthropic's cookbook metaprompt. Triggers when asked to "metaprompt", "write a prompt for X", "generate a prompt template", "turn this task into a prompt", "help me prompt-engineer X", or when a task needs to be run repeatedly over varying inputs and deserves a stable template rather than an ad-hoc prompt.
allowed-tools: ["Read", "Write"]
---

# Metaprompt

Writes prompt templates. You give it a task in plain English; it returns a template
with `{$VARIABLE}` placeholders that someone can fill in later and send to a model.

Source: Anthropic cookbook, `misc/metaprompt.ipynb`
(https://platform.claude.com/cookbook/misc-metaprompt). The reference file is the
cookbook's metaprompt text verbatim, minus its Python string wrapper
(anthropics/anthropic-cookbook, MIT licence). It has no table of contents on purpose —
keeping it verbatim matters more than navigation; read it in full (step 1).

## Procedure

1. **Read `reference/metaprompt.md` in full.** Do not skim it and do not work from
   memory of it. Its five worked examples are the teaching signal — the output
   quality comes from them, not from the closing instructions.

2. **Get the task statement.** One or two sentences describing what the eventual
   prompt should make the assistant do. If the user gave a vague gesture rather than
   a task ("something for our support inbox"), ask once for a concrete sentence
   before proceeding. Do not invent scope.

3. **Substitute the task into the `{{TASK}}` slot** near the end of the reference
   file — that is the only double-brace slot, and the only thing you fill in.

4. **Follow the metaprompt's own three numbered steps, in order**, emitting:
   - `<Inputs>` — the minimal, non-overlapping set of variable *names*. One is
     common; more than three is almost always wrong.
   - `<Instructions Structure>` — the plan for where each variable goes.
   - `<Instructions>` — the finished template.

5. **Write the finished template to a file** if the user named one, or asked for a
   file. Otherwise print it. Default location is the current working directory;
   ask rather than guessing if the target is ambiguous.

## Rules that carry the quality

These come from the metaprompt itself. They are the parts most often lost:

- **You are not completing the task.** You are writing instructions for a model that
  will complete it later. If your output answers the user's example question, you
  have done the wrong thing.
- **Long inputs come before the directions about them.** A `{$DOCUMENT}` goes above
  the instruction that says what to do with the document, never below it.
- **Justification before the verdict.** When the template asks for a score, rating,
  or classification, it must ask for the reasoning first and the score second.
- **Scratchpad only when earned.** Add `<scratchpad>` or `<Inner monologue>` tags for
  genuinely multi-step tasks. Omit for simple ones.
- **Demarcate variables with XML tags** so the model can see where a substituted
  value starts and ends.
- **Name output tags without closing them.** Say "write your answer inside `<answer>`
  tags" — do not emit stray open-and-close tag pairs.

## Placeholder discipline

Two brace conventions are in play and confusing them breaks the output:

| Syntax | Whose | What to do |
|---|---|---|
| `{{TASK}}` | the metaprompt's | You fill this in, once, with the user's task. |
| `{$VARIABLE}` | the generated template's | Must survive **untouched** into your output. Never resolve, never substitute. |

If the template you produce contains no `{$...}` placeholders at all, you have
written an answer rather than a template. Start over.

## Currency note

The cookbook predates the tool-use API. Its fifth example teaches function calling
via `<function_call>` XML tags and a text-parsed `<function_result>`. That pattern is
superseded — the Messages API has native `tool_use` / `tool_result` blocks.

Keep this in mind when the requested task involves tools: take the example's
*structure* (scratchpad before acting, handle the error case, refuse tools you were
not given) but do not reproduce its XML function-call transport. Say so in a note
under the generated template rather than silently modernising it.

The `[YES]`/`[NO]` string-prefix convention in the second example is likewise dated;
prefer a structured output or a tagged answer for anything that needs parsing.
