// @ts-check

/**
 * Scripts - Docs
 */

/* Imports */

import { renderMarkdownDocs } from '../lib/docs.js'

/* Create README */

await renderMarkdownDocs({
  include: 'src/**\/*.ts',
  exclude: 'src/**\/*.test.ts',
  docsExclude: 'src/**\/*Types.ts'
})

/*
await renderHtmlDocs({
  outDir: 'docs',
  include: 'src/**\/*.ts',
  exclude: 'src/**\/*.test.ts',
  docsExclude: 'src/**\/*Types.ts',
  classPrefix: 'frm-',
  themes: {
    dark: 'github-dark',
    light: 'github-light'
  }
})
*/
