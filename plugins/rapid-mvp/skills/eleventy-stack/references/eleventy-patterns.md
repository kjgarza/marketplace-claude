# 11ty Patterns Reference

Detailed file templates and configuration patterns for Eleventy MVP projects.

## .eleventy.js Configuration Template

```js
module.exports = function(eleventyConfig) {
  // Passthrough copy — no processing, just copy as-is
  // Passthrough copy — src/css is NOT included (processed by Tailwind CLI)
  eleventyConfig.addPassthroughCopy("src/js")
  eleventyConfig.addPassthroughCopy("src/assets")

  // Global data
  eleventyConfig.addGlobalData("env", process.env.ELEVENTY_ENV || "development")

  // Custom filters — add project-specific filters here
  eleventyConfig.addFilter("json", (value) => JSON.stringify(value))

  // Example: format minutes to "Xh Ym"
  eleventyConfig.addFilter("formatMinutes", (minutes) => {
    if (!minutes) return "0m"
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  })

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: "/project-name/"  // Set to repo name for GitHub Pages
  }
}
```

## package.json Template

```json
{
  "name": "project-name",
  "version": "1.0.0",
  "scripts": {
    "start": "bun run build:css -- --watch & bunx @11ty/eleventy --serve",
    "build:css": "bunx @tailwindcss/cli -i src/css/main.css -o _site/css/main.css",
    "build": "bun run build:css && bunx @11ty/eleventy",
    "test": "bun test",
    "validate": "bun scripts/validate.js",
    "prebuild": "bun run validate"
  },
  "dependencies": {
    "@11ty/eleventy": "^3.1.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@tailwindcss/cli": "^4.0.0",
    "@tailwindcss/typography": "^4.0.0"
  }
}
```

## Base Layout Template (base.njk)

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title or site.title }}</title>
  <meta name="description" content="{{ description or site.description }}">
  <link rel="stylesheet" href="{{ '/css/main.css' | url }}">
  {% if env == 'production' %}
    {% include "components/google-analytics.njk" %}
  {% endif %}
</head>
<body>
  <main>
    {{ content | safe }}
  </main>
  {% block scripts %}{% endblock %}
</body>
</html>
```

## Index Page Template (index.njk)

```html
---
layout: layouts/base.njk
title: Home
---

<section class="hero">
  <h1>{{ site.title }}</h1>
  <p>{{ site.description }}</p>
</section>
```

## site.json Data Template

```json
{
  "title": "Project Name",
  "description": "Project description",
  "author": "Kristian Garza",
  "url": "https://username.github.io/project-name"
}
```

## Zod Validation Schema Pattern

```js
// src/schemas/data-schema.js
import { z } from "zod"

export const ItemSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slugs must be kebab-case"),
  title: z.string().min(1),
  description: z.string().optional(),
  // Add domain-specific fields
})

export const DataSchema = z.array(ItemSchema)
```

## Validation Script Pattern

```js
// scripts/validate.js
import { readFileSync } from "fs"
import { DataSchema } from "../src/schemas/data-schema.js"

const raw = JSON.parse(readFileSync("src/_data/items.json", "utf-8"))
const result = DataSchema.safeParse(raw)

if (!result.success) {
  console.error("Validation failed:")
  for (const issue of result.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`)
  }
  process.exit(1)
}

console.log(`Validated ${result.data.length} items successfully`)
```

## Generation Script Pattern

```js
// scripts/generate.js
import { readFileSync, writeFileSync } from "fs"

const items = JSON.parse(readFileSync("src/_data/items.json", "utf-8"))

// Transform data for the template layer
const processed = items.map(item => ({
  ...item,
  // Add computed fields
}))

writeFileSync("src/_data/processed.json", JSON.stringify(processed, null, 2))
console.log(`Generated processed data for ${processed.length} items`)
```

## Tailwind CSS Entry Point

```css
/* src/css/main.css */
@import "tailwindcss";
@import "../../tooling/theme.css";
@plugin "@tailwindcss/typography";
```

This file is processed by `@tailwindcss/cli` and output to `_site/css/main.css`. The shared `tooling/theme.css` provides OKLCH design tokens via the `@theme` directive.

## About Page Template (about.njk)

```html
---
layout: layouts/base.njk
title: About
---

<article class="prose prose-lg mx-auto max-w-3xl px-4 py-12">
  <h1>About {{ site.title }}</h1>

  <h2>Motivations</h2>
  <p>{{ about.motivations }}</p>

  <h2>Design Principles</h2>
  <ul>
    {% for principle in about.principles %}
      <li>{{ principle }}</li>
    {% endfor %}
  </ul>

  <h2>How It Was Built</h2>
  <p>{{ about.howBuilt }}</p>
</article>
```

### src/_data/about.json

```json
{
  "motivations": "Describe why this project exists.",
  "principles": [
    "Principle one",
    "Principle two",
    "Principle three"
  ],
  "howBuilt": "Describe the tools and approach used to build this project."
}
```

## GitHub Actions Deploy Template

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run validate
      - run: bun run build
        env:
          ELEVENTY_ENV: production
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site
      - id: deployment
        uses: actions/deploy-pages@v4
```

## .gitignore Template

```
node_modules/
_site/
.DS_Store
*.log
.env
.env.local
```

## Nunjucks Component Pattern

```html
{# src/_includes/components/card.njk #}
<article class="card">
  <h3 class="card-title">{{ title }}</h3>
  {% if description %}
    <p class="card-description">{{ description }}</p>
  {% endif %}
  {{ content | safe }}
</article>
```

## Nunjucks Macro Pattern

```html
{# src/_includes/macros/helpers.njk #}
{% macro badge(text, variant="default") %}
  <span class="badge badge--{{ variant }}">{{ text }}</span>
{% endmacro %}

{% macro icon(name, size="1em") %}
  <svg class="icon" width="{{ size }}" height="{{ size }}">
    <use href="/assets/icons.svg#{{ name }}"></use>
  </svg>
{% endmacro %}
```
