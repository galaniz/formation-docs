# Formation Docs  

A utility to generate Markdown or HTML documentation files from JSDoc comments in JavaScript or TypeScript files.

## Installation

```shell
npm install -D @alanizcreative/formation-docs
```

## getDocs  

**<code>getDocs(args: DocsArgs): Promise&lt;DocsResult&gt;</code>**  

Rich text objects from source code and JSDoc explain.

### Parameters  
- **`args`** <code><a href="#docsargs">DocsArgs</a></code> required

### Returns  

<code>Promise&lt;<a href="#docsresult">DocsResult</a>&gt;</code>

### Examples

```ts
// src/button/button.ts
// src/button/buttonTypes.ts
// src/form/__tests__/form.test.ts
// src/form/form.ts
/**
 * Form
 *
 * @file
 * title: Form Components
 * Output form, field and option elements.
 */
import type { FormType } from './formTypes.js'
/**
 * Outputs form element.
 *
 * @param {FormType} type
 * @return {string}
 */
const Form = (type: FormType): string => {
  // ...
}
// src/form/formTypes.ts:
/**
 * @typedef {'a'|'b'|'c'} FormType
 */
export type FormType = 'a' | 'b' | 'c'

// =========================================================================

import { getDocs } from '@alanizcreative/formation-docs/docs.js'

const result = await getDocs({
  include: 'src/**\/*.ts',
  exclude: 'src/**\/*.test.ts',
  docsInclude: 'src/form/**\/*.ts',
  docsExclude: 'src/**\/*Types.ts'
})

result = {
  'src/form': {
    content: [
      { tag: 'h1', content: 'Form Components' },
      { tag: 'p', content: 'Output form, field and option elements.' },
      { tag: 'h2', content: 'Form' },
      { tag: 'p', content: [{
        tag: 'strong', content: [{
          tag: 'code', content: [{
            content: 'Form(type: FormType): string'
          }]
        }]}
      ]},
      { tag: 'p', content: 'Outputs form element.' },
      { tag: 'h2', content: 'Parameters' },
      { tag: 'dl', content: [{
        tag: 'div', content: [{
          tag: 'dt', content: [
            { tag: 'strong', content: [{ tag: 'code', content: 'type' }]},
            { content: ' ' },
            { tag: 'code', content: [{
              content: [{ tag: 'a', content: 'FormType', link: '#formtype' }]
            }]},
            { content: ' ' },
            { content: 'required' }
          ]
        },
        { tag: 'dd', content: [] }
      ]}]},
      { tag: 'h2', content: 'Returns' },
      { tag: 'p', content: [{
        tag: 'code', content: [{ content: 'string' }]
      }]},
      { tag: 'h2', content: 'Types' },
      { tag: 'h3', content: 'FormType' },
      { tag: 'p', content: [
        { tag: 'strong', content: 'Type:' },
        { content: ' ' },
        { tag: 'code', content: [{
          content: [{ content: '&#39;a&#39; | &#39;b&#39; | &#39;c&#39;' }]
        }]}
      ]}
    ]
  } 
}
```

## renderMarkdownDocs  

**<code>renderMarkdownDocs(args: DocsArgs): Promise&lt;void&gt;</code>**  

Output normalized JSDoc data as Markdown files.

### Parameters  
- **`args`** <code><a href="#docsargs">DocsArgs</a></code> required

### Returns  

<code>Promise&lt;void&gt;</code>

### Examples

```js
import { renderMarkdownDocs } from '@alanizcreative/formation-docs/docs.js'

await renderMarkdownDocs({
  include: 'src/**\/*.ts',
  exclude: [
    'src/**\/*.test.ts',
    'src/**\/*Mock.ts'
  ],
  docsInclude: 'src/form/**\/*.ts',
  docsExclude: 'src/**\/*Types.ts'
})

// src/button/button.ts
// src/button/buttonTypes.ts
// src/form/__tests__/form.test.ts
// src/form/form.ts
// src/form/README.md
// src/form/formMock.ts
// src/form/formTypes.ts
```

## renderHtmlDocs  

**<code>renderHtmlDocs(args: DocsHtmlArgs): Promise&lt;void&gt;</code>**  

Output normalized JSDoc data as HTML files.

### Parameters  
- **`args`** <code><a href="#docshtmlargs">DocsHtmlArgs</a></code> required

### Returns  

<code>Promise&lt;void&gt;</code>

### Examples

```js
import { renderHtmlDocs } from '@alanizcreative/formation-docs/docs.js'

await renderHtmlDocs({
  outDir: 'docs',
  include: 'src/**\/*.ts',
  exclude: 'src/**\/*.test.ts',
  docsExclude: 'src/**\/*Types.ts',
  url: 'https://docs.formation.org'
})

// src/button/button.ts
// src/button/buttonTypes.ts
// src/form/__tests__/form.test.ts
// src/form/form.ts
// src/form/formTypes.ts
// docs/button/index.html
// docs/form/index.html
```

## Types

### DocsFilterTitle  

**Type:** <code>function</code>

#### Parameters  
- **`title`** <code>string</code> required  
- **`dir`** <code>string</code> required

### DocsArgs  

**Type:** <code>object</code>

#### Properties  
- **`include`** <code>string | string[]</code> required  
Glob pattern of files to include in types.  
- **`exclude`** <code>string | string[]</code> optional  
Glob pattern of files to exclude from types.  
- **`docsInclude`** <code>string | string[]</code> optional  
Glob pattern of files to include in result.  
- **`docsExclude`** <code>string | string[]</code> optional  
Glob pattern of files to exclude from result.  
- **`docsTypes`** <code>string | string[]</code> optional  
Glob pattern of type definition files.  
- **`srcDir`** <code>string</code> optional  
Source directory of input files.  
Default: `src`  
- **`outDir`** <code>string</code> optional  
Directory to write documentation files to.  
- **`url`** <code>string</code> optional  
Repository URL for Markdown docs or site URL for HTML docs.  
- **`index`** <code>string</code> optional  
Comments representing index documentation page.  
- **`filterTitle`** <code><a href="#docsfiltertitle">DocsFilterTitle</a></code> optional  
Customize title for multi file directories.

### DocsContent  

**Type:** <code>object</code>

#### Properties  
- **`content`** <code>string | <a href="#docscontent">DocsContent</a>[]</code> required  
Plain text or nested HTML content.  
- **`tag`** <code>string</code> optional  
HTML element tag.  
- **`link`** <code>string</code> optional  
Anchor link to type definition.

### DocsResult  

**Type:** <code>Object&lt;string, <a href="#docscontent">DocsContent</a>&gt;</code>

### DocsFilterAttr  

**Type:** <code>function</code>

#### Parameters  
- **`attr`** <code>Object&lt;string, string&gt;</code> required  
Element attributes as key-value pairs.  
- **`data`** <code><a href="#docscontent">DocsContent</a></code> required  
Element tag and content.  
- **`outerTag`** <code>string</code> required  
Parent element tag.

#### Returns  

<code>Object&lt;string, string&gt;</code>

### DocsNavigationItem  

**Type:** <code>object</code>

#### Properties  
- **`id`** <code>string</code> required  
- **`title`** <code>string</code> required  
- **`link`** <code>string</code> required  
- **`children`** <code><a href="#docsnavigationitem">DocsNavigationItem</a>[]</code> optional

### DocsHeading  

**Type:** <code>object</code>

#### Properties  
- **`id`** <code>string</code> required  
- **`tag`** <code>string</code> required  
- **`title`** <code>string</code> required  
- **`children`** <code><a href="#docsheading">DocsHeading</a>[]</code> optional

### DocsFilterOutput  

**Type:** <code>function</code>

#### Parameters  
- **`output`** <code>string</code> required  
HTML output.  
- **`id`** <code>string</code> required  
Kebab case of file path.  
- **`title`** <code>string</code> required  
File title.  
- **`slug`** <code>string</code> required  
File path as link.  
- **`navigation`** <code><a href="#docsnavigationitem">DocsNavigationItem</a>[]</code> required  
Objects matching directory stucture in alphabetical order.  
- **`headings`** <code><a href="#docsheading">DocsHeading</a>[]</code> required  
File headings as nested object stucture.  
- **`css`** <code>string</code> optional  
CSS output by [Shiki](https://shiki.style/packages/transformers#transformerstyletoclass).

#### Returns  

<code>string</code>

### DocsHtmlArgs  

**Type:** <code>object</code>  

**Augments:** <code><a href="#docsargs">DocsArgs</a></code>

#### Properties  
- **`outDir`** <code>string</code> optional  
Directory to write documentation files to.  
Default: `docs`  
- **`themes`** <code>Object&lt;string, string&gt;</code> optional  
Themes to pass to [Shiki](https://shiki.style/) for syntax highlighting.  
- **`classPrefix`** <code>string</code> optional  
Prefix classes output by [Shiki Transformer](https://shiki.style/packages/transformers/).  
- **`filterAttr`** <code><a href="#docsfilterattr">DocsFilterAttr</a></code> optional  
Customize HTML element attributes.  
- **`filterOutput`** <code><a href="#docsfilteroutput">DocsFilterOutput</a></code> optional  
Customize HTML output.