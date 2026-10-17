#!/usr/bin/env bun
/**
 * Emit the source registry as TSV so bash can iterate.
 * Columns: slug<TAB>url<TAB>category<TAB>extraction_kind
 */

import { SOURCES } from "./sources.ts";

if (import.meta.main) {
  for (const s of SOURCES) {
    process.stdout.write(
      `${s.slug}\t${s.url}\t${s.category}\t${s.extraction.kind}\n`,
    );
  }
}
