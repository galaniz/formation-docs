/**
 * Docs - Tests
 */

/* Imports */

import type { DocsHeading, DocsNavigationItem } from '../docsTypes.js'
import { it, describe, expect, afterEach, beforeAll, afterAll } from 'vitest'
import { rm, mkdtemp, mkdir, writeFile, readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { renderMarkdownDocs, renderHtmlDocs } from '../docs.js'

/**
 * @typedef {object} TestFilesResult
 * @prop {string[]} files
 * @prop {string[]} contents
 * @prop {string[]} styles
 * @prop {string[]} spanClasses
 * @prop {string[]} preClasses
 */
interface TestFilesResult {
  files: string[]
  contents: string[]
  styles: string[]
  spanClasses: string[]
  preClasses: string[]
}

/* Test files */

let tempDir: string
let srcDir: string
let outDir: string
let index: string

beforeAll(async () => {
  const markdownDesc = '**Test** `param` *description* with [Link](https://test.docs).'
  const fileExample = "TestLet.lorem = 'string'\nTestLet.ipsum = 'string'"

  tempDir = await mkdtemp(join(process.env.TEMP || tmpdir(), 'test-'))
  srcDir = join(tempDir, 'src')
  outDir = join(tempDir, 'docs')
  index = /* js */`
  /**
   * Test Index
   *
   * @file
   * title: Test index title
   * Test index description.
   *
   * @example
   * title: Installation
   * shell: npm install -D @test/test
   *
   * @index
   */
  `

  await mkdir(srcDir)
  await mkdir(outDir)
  await mkdir(`${srcDir}/test`)
  await mkdir(`${srcDir}/global`)
  await mkdir(`${srcDir}/text`)
  await mkdir(`${srcDir}/test/const`)
  await mkdir(`${srcDir}/test/class`)
  await writeFile(`${srcDir}/test/TestLetExample.js`, fileExample)
  await writeFile(`${srcDir}/text/TestText.txt`, 'Text')
  await writeFile(`${srcDir}/test/TestEmpty.ts`, '')
  await writeFile(`${srcDir}/test/TestComments.ts`, /* js */`
    /**
     * Test empty.
     */
  `)

  await writeFile(`${srcDir}/test/TestFunction.test.ts`, /* js */`
    /**
     * Test skip.
     *
     * @param {string} str
     * @return {string}
     */
    const test = (str) => str
  `)

  await writeFile(`${srcDir}/global/TestGlobalTypes.ts`, /* js */`
    /**
     * @typedef {Object<string, *>} Generic
     */
    export type Generic = Record<string, unknown>
  `)

  await writeFile(`${srcDir}/test/TestTypes.ts`, /* js */`
    /**
     * @typedef {10|20|30} TestConst
     */
    export type TestConst = 10 | 20 | 30

    /**
     * @typedef {object} TestLet
     * @prop {string} lorem
     * @prop {string} ipsum
     */
    export interface TestLet {
      lorem: string
      ipsum: string
    }

    /**
     * @typedef {object} TestObj
     * @extends {Generic}
     * @prop {'one'|'two'|'three'} str - Test str prop description.
     * @prop {number|string|boolean} [mix=0] - Test mix prop description.
     * @prop {Object<string, TestObj>} [obj]
     * @prop {TestObj} [ref]
     * @prop {TestConst} [con]
     */
    export interface TestObj extends Generic {
      str: 'one' | 'two' | 'three'
      mix?: number | string | boolean
      obj?: Record<string, TestObj>
      ref?: TestObj
      con?: TestConst
    }

    /**
     * @typedef {function} TestFunc
     * @param {string} str
     * @return {Promise<void>}
     */
    export type TestFunc = (str: string) => Promise<void> 
  `)

  await writeFile(`${srcDir}/test/const/TestConst.ts`, /* js */`
    /**
     * Test const description.
     *
     * @type {TestConst}
     */
    const TestConst: TestConst = 10

    /* Exports */

    export { TestConst }
  `)

  await writeFile(`${srcDir}/test/TestLet.ts`, /* js */`
    /**
     * Test let description.
     *
     * @example
     * js: ./TestLetExample.js
     * @type {TestLet}
     */
    let TestLet: TestLet = {
      lorem: 'dolorem',
      ipsum: 'sed'
    }

    /* Exports */

    export { TestLet }
  `)

  await writeFile(`${srcDir}/test/TestFunction.ts`, /* js */`
    /**
     * Test function one description.
     *
     * @type {TestFunc}
     */
    const TestFuncOne: TestFunc = async (str) => {
      await readFile(str)
    }

    /**
     * Test function two description.
     *
     * @example
     * title: Test function two example
     * desc: Test function two example description.
     * js: import { TestFuncTwo } from '@test/test.js'
     * 
     * const test = TestFuncTwo({
     *   one: 'one'
     *   two: 2,
     *   three: []
     * })
     * @param {Generic} args ${markdownDesc}
     * @param {TestObj} [obj]
     * @param {boolean} [desc=false] - Test desc param.
     * @return {string|string[]|null} - Test return description.
     */
    const TestFuncTwo = (args: Generic, obj?: TestObj, desc: boolean = false): string | string[] | null => {
      return ''
    }

    /* Exports */

    export { TestFuncOne, TestFuncTwo }
  `)

  await writeFile(`${srcDir}/test/TestGenerator.ts`, /* js */`
    /**
     * Test generator function description.
     *
     * @param {number} i
     * @yield {number} - Test yield description.
     * @example
     * ts: ./TestEmpty.ts
     */
    const TestGenOne = function * (i: number): Generator<number> {
      yield i + 10
    }

    /**
     * @yield {number}
     */
    const TestGenTwo = function * (): Generator<number> {
      yield i + 20
    }

    /* Exports */

    export { TestGenOne, TestGenTwo }
  `)

  await writeFile(`${srcDir}/test/TestBaseClass.ts`, /* js */`
    /**
     * Test class base description.
     */
    class TestBaseClass {
      /**
       * Test base initialize state.
       *
       * @type {boolean}
       */
      init: boolean = false

      constructor () {
        this.init = true
      }
    }

    /* Exports */

    export { TestBaseClass }
  `)

  await writeFile(`${srcDir}/test/class/TestClass.ts`, /* js */`
    /* Imports */

    import { TestBaseClass } from '../TestBaseClass.js'

    /**
     * @extends {TestBaseClass}
     * @example
     * title: Test class example
     * js: import { TestClass } from '@test/testClass.js'
     *
     * const test = new TestClass({
     *  str: 'three',
     *  mix: 999
     * })
     */
    class TestClass extends TestBaseClass {
      /**
       * Test props.
       *
       * @type {Map<string, TestObj>}
       */
      props: Map<string, TestObj> = new Map()

      /**
       * Test private prop.
       *
       * @private
       * @type {string}
       */
      #privateProp: string = ''

      /**
       * Test class constructor.
       *
       * @param {Map<string, TestObj>} props
       */
      constructor (props: Map<string, TestObj>) {
        super()
        this.props = props
      }

      /**
       * Test private class method.
       *
       * @return {string}
       */
      getPrivateProp (): string {
        return this.#privateProp
      }

      /**
       * Test class method.
       *
       * @param {string} key
       * @return {TestObj|undefined}
       */
      getProp (key: string): TestObj | undefined {
        return this.props.get(key)
      }
    }

    /* Exports */

    export { TestClass }
  `)

  await writeFile(`${srcDir}/Test.js`, /* js */`
    /**
     * Test JS description.
     *
     * @return {number}
     */
    const TestJs = () => {
      return 1 + 1
    }

    /* Exports */

    export { TestJs }
  `)
})

afterAll(async () => {
  await rm(tempDir, { recursive: true, force: true })
})

afterEach(async () => {
  for await (const path of testFilePaths(tempDir)) {
    if (path.endsWith('.md') || path.endsWith('.html')) {
      await rm(path)
    }
  }
})

/**
 * Relative file paths and contents.
 *
 * @param {'markdown'|'html'} type
 * @return {Promise<TestFilesResult>}
 */
const testFiles = async (type: 'markdown' | 'html'): Promise<TestFilesResult> => {
  const files: string[] = []
  const contents: string[] = []
  const styles: string[] = []
  const spanClasses: string[] = []
  const preClasses: string[] = []
  const isMarkdown = type === 'markdown'
  const ext = isMarkdown ? '.md' : '.html'
  const styleReg = /(?<=<style>)(.*?)(?=<\/style>)/g
  const spanReg = /(?<=<span)\s+class="[^"]*"(.*?)/g
  const preReg = /(?<=<pre)\s+class="[^"]*"(.*?)/g

  for await (const path of testFilePaths(tempDir)) {
    if (path.endsWith(ext)) {
      const file = path.replace(tempDir, '')
      const content = await readFile(path, 'utf-8')

      files.push(file)

      if (isMarkdown) {
        contents.push(content)
        continue
      }

      const style = content.match(styleReg)
      const spanClass = content.match(spanReg)
      const preClass = content.match(preReg)

      if (style) {
        styles.push(...style)
      }

      if (spanClass) {
        spanClasses.push(...spanClass)
      }

      if (preClass) {
        preClasses.push(...preClass)
      }

      contents.push(
        content
        .replace(styleReg, '')
        .replace(spanReg, '')
        .replace(preReg, '')
        .replace(/\n/g, '')
      )
    }
  }

  return {
    files,
    contents,
    styles,
    spanClasses,
    preClasses
  }
}

/**
 * Recurse directory to get all file paths in it.
 *
 * @param {string} dir
 * @yield {string[]}
 */
const testFilePaths = async function * (dir: string): AsyncGenerator<string> {
  const files = await readdir(dir, { withFileTypes: true })

  for (const file of files) {
    if (file.isDirectory()) {
      yield * testFilePaths(join(dir, file.name))
    } else {
      yield join(dir, file.name)
    }
  }
}

/**
 * README files contents.
 *
 * @type {Object<string, string>}
 */
const testReadMe: Record<string, string> = {
/* Index */
'/README.md': `# Test index title  

Test index description.

## Installation

\`\`\`shell
npm install -D @test/test
\`\`\`

## Index
<details>
<summary>Test</summary>
  
- <a href="%url%/%temp_dir%/src/test/class/README.md">Class</a>  
- <a href="%url%/%temp_dir%/src/test/const/README.md">Const</a>  
- <a href="%url%/%temp_dir%/src/test/README.md">Test</a>

</details>`,
/* Test */
'/src/test/README.md': `# Test

## TestLet  

Test let description.  

**Type:** <code><a href="#testlet">TestLet</a></code>

### Examples

\`\`\`js
TestLet.lorem = 'string'
TestLet.ipsum = 'string'
\`\`\`

## TestBaseClass  

Test class base description.

### Constructor  

**<code>new TestBaseClass(): TestBaseClass</code>**

### Properties

#### init  

Test base initialize state.  

**Type:** <code>boolean</code>

## TestGenOne  

**<code>TestGenOne(i: number): </code>**  

Test generator function description.

### Parameters  
- **\`i\`** <code>number</code> required

### Yields  

<code>number</code> - Test yield description.

## TestGenTwo  

**<code>TestGenTwo(): </code>**

### Yields  

<code>number</code>

## TestFuncOne  

**<code>TestFuncOne(str: string): Promise&lt;void&gt;</code>**  

Test function one description.

### Parameters  
- **\`str\`** <code>string</code> required

### Returns  

<code>Promise&lt;void&gt;</code>

## TestFuncTwo  

**<code>TestFuncTwo(args: Generic, obj?: TestObj, desc?: boolean): string | string[] | null</code>**  

Test function two description.

### Parameters  
- **\`args\`** <code><a href="%url%/%temp_dir%/src/global/README.md#generic">Generic</a></code> required  
**Test** \`param\` *description* with [Link](https://test.docs).  
- **\`obj\`** <code><a href="#testobj">TestObj</a></code> optional  
- **\`desc\`** <code>boolean</code> optional  
Test desc param.  
Default: \`false\`

### Returns  

<code>string | string[] | null</code> - Test return description.

### Examples

#### Test function two example

Test function two example description.

\`\`\`js
import { TestFuncTwo } from '@test/test.js'

const test = TestFuncTwo({
  one: 'one'
  two: 2,
  three: []
})
\`\`\`

## Types

### TestLet  

**Type:** <code>object</code>

#### Properties  
- **\`lorem\`** <code>string</code> required  
- **\`ipsum\`** <code>string</code> required

### TestConst  

**Type:** <code>10 | 20 | 30</code>

### TestObj  

**Type:** <code>object</code>  

**Augments:** <code><a href="%url%/%temp_dir%/src/global/README.md#generic">Generic</a></code>

#### Properties  
- **\`str\`** <code>&#39;one&#39; | &#39;two&#39; | &#39;three&#39;</code> required  
Test str prop description.  
- **\`mix\`** <code>number | string | boolean</code> optional  
Test mix prop description.  
Default: \`0\`  
- **\`obj\`** <code>Object&lt;string, <a href="#testobj">TestObj</a>&gt;</code> optional  
- **\`ref\`** <code><a href="#testobj">TestObj</a></code> optional  
- **\`con\`** <code><a href="#testconst">TestConst</a></code> optional`,
/* Const */
'/src/test/const/README.md': `# TestConst  

Test const description.  

**Type:** <code><a href="%url%/%temp_dir%/src/test/README.md#testconst">TestConst</a></code>`,
/* Class */
'/src/test/class/README.md': `# TestClass

## Constructor  

**<code>new TestClass(props: Map&lt;string, TestObj&gt;): TestClass</code>**  

Test class constructor.  

**Augments:** <code><a href="%url%/%temp_dir%/src/test/README.md#testbaseclass">TestBaseClass</a></code>

### Parameters  
- **\`props\`** <code>Map&lt;string, <a href="%url%/%temp_dir%/src/test/README.md#testobj">TestObj</a>&gt;</code> required

## Properties

### props  

Test props.  

**Type:** <code>Map&lt;string, <a href="%url%/%temp_dir%/src/test/README.md#testobj">TestObj</a>&gt;</code>

## Methods

### getPrivateProp  

**<code>getPrivateProp(): string</code>**  

Test private class method.

#### Returns  

<code>string</code>

### getProp  

**<code>getProp(key: string): TestObj | undefined</code>**  

Test class method.

#### Parameters  
- **\`key\`** <code>string</code> required

#### Returns  

<code><a href="%url%/%temp_dir%/src/test/README.md#testobj">TestObj</a> | undefined</code>

## Examples

### Test class example

\`\`\`js
import { TestClass } from '@test/testClass.js'

const test = new TestClass({
 str: 'three',
 mix: 999
})
\`\`\``
}

/**
 * HTML files contents.
 *
 * @type {Object<string, string>}
 */
const testHtml: Record<string, string> = {
  '/docs/index.html': `
<!DOCTYPE html>
<html lang="en">
<head>
<title>Test index title</title>
<style></style>
</head>
<body>
<h1 id="test-index-title">Test index title<a href="#test-index-title" aria-label="Permalink: Test index title">#</a></h1>
<p>Test index description.</p>
<h2 id="installation"%h2_attr%>Installation<a href="#installation" aria-label="Permalink: Installation"%a_attr%>#</a></h2>
<pre tabindex="0"><code><span><span>npm</span><span> install</span><span> -D</span><span> @test/test</span></span></code></pre>
<h2 id="index"%h2_attr%>Index<a href="#index" aria-label="Permalink: Index"%a_attr%>#</a></h2>
<details>
<summary>Test</summary>
<ul>
<li><a href="%url%/test/class/">Class</a></li>
<li><a href="%url%/test/const/">Const</a></li>
<li><a href="%url%/test/">Test</a></li>
</ul>
</details>
</body>
</html>
`,
  '/docs/test/index.html': `
<!DOCTYPE html>
<html lang="en">
<head>
<title>Test</title>
<style></style>
</head>
<body>
<h1 id="test">Test<a href="#test" aria-label="Permalink: Test">#</a></h1>
<h2 id="testlet"%h2_attr%>TestLet<a href="#testlet" aria-label="Permalink: TestLet"%a_attr%>#</a></h2>
<p>Test let description.</p>
<p><strong>Type:</strong> <code><a href="#testlet">TestLet</a></code></p>
<h3 id="examples">Examples<a href="#examples" aria-label="Permalink: Examples">#</a></h3>
<pre tabindex="0"><code><span><span>TestLet</span><span>.</span><span>lorem</span><span> =</span><span> '</span><span>string</span><span>'</span></span>
<span><span>TestLet</span><span>.</span><span>ipsum</span><span> =</span><span> '</span><span>string</span><span>'</span></span></code></pre>
<h2 id="testbaseclass"%h2_attr%>TestBaseClass<a href="#testbaseclass" aria-label="Permalink: TestBaseClass"%a_attr%>#</a></h2>
<p>Test class base description.</p>
<h3 id="constructor">Constructor<a href="#constructor" aria-label="Permalink: Constructor">#</a></h3>
<p><strong><code>new TestBaseClass(): TestBaseClass</code></strong></p>
<h3 id="properties">Properties<a href="#properties" aria-label="Permalink: Properties">#</a></h3>
<h4 id="init">init<a href="#init" aria-label="Permalink: init">#</a></h4>
<p>Test base initialize state.</p>
<p><strong>Type:</strong> <code>boolean</code></p>
<h2 id="testgenone"%h2_attr%>TestGenOne<a href="#testgenone" aria-label="Permalink: TestGenOne"%a_attr%>#</a></h2>
<p><strong><code>TestGenOne(i: number): </code></strong></p>
<p>Test generator function description.</p>
<h3 id="parameters">Parameters<a href="#parameters" aria-label="Permalink: Parameters">#</a></h3>
<dl>
<div><dt><strong><code>i</code></strong> <code>number</code> required</dt></div>
</dl>
<h3 id="yields">Yields<a href="#yields" aria-label="Permalink: Yields">#</a></h3>
<p><code>number</code> - Test yield description.</p>
<h2 id="testgentwo"%h2_attr%>TestGenTwo<a href="#testgentwo" aria-label="Permalink: TestGenTwo"%a_attr%>#</a></h2>
<p><strong><code>TestGenTwo(): </code></strong></p>
<h3 id="yields-1">Yields<a href="#yields-1" aria-label="Permalink: Yields">#</a></h3>
<p><code>number</code></p>
<h2 id="testfuncone"%h2_attr%>TestFuncOne<a href="#testfuncone" aria-label="Permalink: TestFuncOne"%a_attr%>#</a></h2>
<p><strong><code>TestFuncOne(str: string): Promise&lt;void&gt;</code></strong></p>
<p>Test function one description.</p>
<h3 id="parameters-1">Parameters<a href="#parameters-1" aria-label="Permalink: Parameters">#</a></h3>
<dl>
<div><dt><strong><code>str</code></strong> <code>string</code> required</dt></div>
</dl>
<h3 id="returns">Returns<a href="#returns" aria-label="Permalink: Returns">#</a></h3>
<p><code>Promise&lt;void&gt;</code></p>
<h2 id="testfunctwo"%h2_attr%>TestFuncTwo<a href="#testfunctwo" aria-label="Permalink: TestFuncTwo"%a_attr%>#</a></h2>
<p><strong><code>TestFuncTwo(args: Generic, obj?: TestObj, desc?: boolean): string | string[] | null</code></strong></p>
<p>Test function two description.</p>
<h3 id="parameters-2">Parameters<a href="#parameters-2" aria-label="Permalink: Parameters">#</a></h3>
<dl>
<div>
<dt><strong><code>args</code></strong> <code><a href="%url%/global/#generic">Generic</a></code> required</dt>
<dd><p><strong>Test</strong> <code>param</code> <em>description</em> with <a href="https://test.docs">Link</a>.</p></dd>
</div>
<div>
<dt><strong><code>obj</code></strong> <code><a href="#testobj">TestObj</a></code> optional</dt>
</div>
<div>
<dt><strong><code>desc</code></strong> <code>boolean</code> optional</dt>
<dd>
<p>Test desc param.</p>
<p>Default: <code>false</code></p>
</dd>
</div>
</dl>
<h3 id="returns-1">Returns<a href="#returns-1" aria-label="Permalink: Returns">#</a></h3>
<p><code>string | string[] | null</code> - Test return description.</p>
<h3 id="examples-1">Examples<a href="#examples-1" aria-label="Permalink: Examples">#</a></h3>
<h4 id="test-function-two-example">Test function two example<a href="#test-function-two-example" aria-label="Permalink: Test function two example">#</a></h4>
<p>Test function two example description.</p>
<pre tabindex="0"><code><span><span>import</span><span> {</span><span> TestFuncTwo</span><span> }</span><span> from</span><span> '</span><span>@test/test.js</span><span>'</span></span>
<span></span>
<span><span>const</span><span> test</span><span> =</span><span> TestFuncTwo</span><span>({</span></span>
<span><span>  one</span><span>:</span><span> '</span><span>one</span><span>'</span></span>
<span><span>  two</span><span>: </span><span>2</span><span>,</span></span>
<span><span>  three</span><span>:</span><span> []</span></span>
<span><span>})</span></span></code></pre>
<h2 id="types"%h2_attr%>Types<a href="#types" aria-label="Permalink: Types"%a_attr%>#</a></h2>
<h3 id="testlet-1">TestLet<a href="#testlet-1" aria-label="Permalink: TestLet">#</a></h3>
<p><strong>Type:</strong> <code>object</code></p>
<h4 id="properties-1">Properties<a href="#properties-1" aria-label="Permalink: Properties">#</a></h4>
<dl>
<div><dt><strong><code>lorem</code></strong> <code>string</code> required</dt></div>
<div><dt><strong><code>ipsum</code></strong> <code>string</code> required</dt></div>
</dl>
<h3 id="testconst">TestConst<a href="#testconst" aria-label="Permalink: TestConst">#</a></h3>
<p><strong>Type:</strong> <code>10 | 20 | 30</code></p>
<h3 id="testobj">TestObj<a href="#testobj" aria-label="Permalink: TestObj">#</a></h3>
<p><strong>Type:</strong> <code>object</code></p>
<p><strong>Augments:</strong> <code><a href="%url%/global/#generic">Generic</a></code></p>
<h4 id="properties-2">Properties<a href="#properties-2" aria-label="Permalink: Properties">#</a></h4>
<dl>
<div>
<dt><strong><code>str</code></strong> <code>&#39;one&#39; | &#39;two&#39; | &#39;three&#39;</code> required</dt>
<dd>
<p>Test str prop description.</p>
</dd>
</div>
<div>
<dt><strong><code>mix</code></strong> <code>number | string | boolean</code> optional</dt>
<dd>
<p>Test mix prop description.</p>
<p>Default: <code>0</code></p>
</dd>
</div>
<div><dt><strong><code>obj</code></strong> <code>Object&lt;string, <a href="#testobj">TestObj</a>&gt;</code> optional</dt></div>
<div><dt><strong><code>ref</code></strong> <code><a href="#testobj">TestObj</a></code> optional</dt></div>
<div><dt><strong><code>con</code></strong> <code><a href="#testconst">TestConst</a></code> optional</dt></div>
</dl>
</body>
</html>
  `,
  '/docs/test/class/index.html': `
<!DOCTYPE html>
<html lang="en">
<head>
<title>TestClass</title>
<style></style>
</head>
<body>
<h1 id="testclass">TestClass<a href="#testclass" aria-label="Permalink: TestClass">#</a></h1>
<h2 id="constructor"%h2_attr%>Constructor<a href="#constructor" aria-label="Permalink: Constructor"%a_attr%>#</a></h2>
<p><strong><code>new TestClass(props: Map&lt;string, TestObj&gt;): TestClass</code></strong></p>
<p>Test class constructor.</p>
<p><strong>Augments:</strong> <code><a href="%url%/test/#testbaseclass">TestBaseClass</a></code></p>
<h3 id="parameters">Parameters<a href="#parameters" aria-label="Permalink: Parameters">#</a></h3>
<dl>
<div>
<dt><strong><code>props</code></strong> <code>Map&lt;string, <a href="%url%/test/#testobj">TestObj</a>&gt;</code> required</dt>
</div>
</dl>
<h2 id="properties"%h2_attr%>Properties<a href="#properties" aria-label="Permalink: Properties"%a_attr%>#</a></h2>
<h3 id="props">props<a href="#props" aria-label="Permalink: props">#</a></h3>
<p>Test props.</p>
<p><strong>Type:</strong> <code>Map&lt;string, <a href="%url%/test/#testobj">TestObj</a>&gt;</code></p>
<h2 id="methods"%h2_attr%>Methods<a href="#methods" aria-label="Permalink: Methods"%a_attr%>#</a></h2>
<h3 id="getprivateprop">getPrivateProp<a href="#getprivateprop" aria-label="Permalink: getPrivateProp">#</a></h3>
<p><strong><code>getPrivateProp(): string</code></strong></p>
<p>Test private class method.</p>
<h4 id="returns">Returns<a href="#returns" aria-label="Permalink: Returns">#</a></h4>
<p><code>string</code></p>
<h3 id="getprop">getProp<a href="#getprop" aria-label="Permalink: getProp">#</a></h3>
<p><strong><code>getProp(key: string): TestObj | undefined</code></strong></p>
<p>Test class method.</p>
<h4 id="parameters-1">Parameters<a href="#parameters-1" aria-label="Permalink: Parameters">#</a></h4>
<dl>
<div>
<dt><strong><code>key</code></strong> <code>string</code> required</dt>
</div>
</dl>
<h4 id="returns-1">Returns<a href="#returns-1" aria-label="Permalink: Returns">#</a></h4>
<p><code><a href="%url%/test/#testobj">TestObj</a> | undefined</code></p>
<h2 id="examples"%h2_attr%>Examples<a href="#examples" aria-label="Permalink: Examples"%a_attr%>#</a></h2>
<h3 id="test-class-example">Test class example<a href="#test-class-example" aria-label="Permalink: Test class example">#</a></h3>
<pre tabindex="0"><code><span><span>import</span><span> {</span><span> TestClass</span><span> }</span><span> from</span><span> '</span><span>@test/testClass.js</span><span>'</span></span>
<span></span>
<span><span>const</span><span> test</span><span> =</span><span> new</span><span> TestClass</span><span>({</span></span>
<span><span> str</span><span>:</span><span> '</span><span>three</span><span>'</span><span>,</span></span>
<span><span> mix</span><span>:</span><span> 999</span></span>
<span><span>})</span></span></code></pre>
</body>
</html>
  `,
  '/docs/test/const/index.html': `
<!DOCTYPE html>
<html lang="en">
<head>
<title>TestConst</title>
<style></style>
</head>
<body>
<h1 id="testconst">TestConst<a href="#testconst" aria-label="Permalink: TestConst">#</a></h1>
<p>Test const description.</p>
<p><strong>Type:</strong> <code><a href="%url%/test/#testconst">TestConst</a></code></p>
</body>
</html>
  `
}

/* Test renderMarkdownDocs */

describe('renderMarkdownDocs()', () => {
  it('should create index, test, class and const README files', async () => {
    await renderMarkdownDocs({
      srcDir,
      include: `${srcDir}/**/*.ts`,
      exclude: `${srcDir}/**/*.test.ts`,
      docsExclude: `${srcDir}/**/*Types.ts`,
      index
    })

    const { files, contents } = await testFiles('markdown')
    const expectedFiles = [
      '/README.md',
      '/src/test/README.md',
      '/src/test/class/README.md',
      '/src/test/const/README.md'
    ]

    const expectedContents = expectedFiles.map(
      file => testReadMe[file]?.replace(/%temp_dir%/g, tempDir).replace(/%url%/g, '')
    )

    expect(files).toEqual(expectedFiles)
    expect(contents).toEqual(expectedContents)
  })

  it('should create index, test, class, const and type README files', async () => {
    await renderMarkdownDocs({
      srcDir,
      include: `${srcDir}/**/*.ts`,
      exclude: `${srcDir}/**/*.test.ts`,
      docsTypes: `${srcDir}/**/*Types.ts`,
      index
    })

    const { files, contents } = await testFiles('markdown')
    const expectedFiles = [
      '/README.md',
      '/src/global/README.md',
      '/src/test/README.md',
      '/src/test/class/README.md',
      '/src/test/const/README.md'
    ]

    const expectedReadMe: Record<string, string> = {
      '/README.md': `# Test index title  

Test index description.

## Installation

\`\`\`shell
npm install -D @test/test
\`\`\`

## Index
<details>
<summary>Global</summary>
  
- <a href="%url%/%temp_dir%/src/global/README.md">Global</a>

</details>
<details>
<summary>Test</summary>
  
- <a href="%url%/%temp_dir%/src/test/class/README.md">Class</a>  
- <a href="%url%/%temp_dir%/src/test/const/README.md">Const</a>  
- <a href="%url%/%temp_dir%/src/test/README.md">Test</a>

</details>`,
      '/src/global/README.md': `# Global

## Types

### Generic  

**Type:** <code>Object&lt;string, &ast;&gt;</code>`,
      '/src/test/README.md': `# Test

## TestLet  

Test let description.  

**Type:** <code><a href="#testlet">TestLet</a></code>

### Examples

\`\`\`js
TestLet.lorem = 'string'
TestLet.ipsum = 'string'
\`\`\`

## TestBaseClass  

Test class base description.

### Constructor  

**<code>new TestBaseClass(): TestBaseClass</code>**

### Properties

#### init  

Test base initialize state.  

**Type:** <code>boolean</code>

## TestGenOne  

**<code>TestGenOne(i: number): </code>**  

Test generator function description.

### Parameters  
- **\`i\`** <code>number</code> required

### Yields  

<code>number</code> - Test yield description.

## TestGenTwo  

**<code>TestGenTwo(): </code>**

### Yields  

<code>number</code>

## TestFuncOne  

**<code>TestFuncOne(str: string): Promise&lt;void&gt;</code>**  

Test function one description.

### Parameters  
- **\`str\`** <code>string</code> required

### Returns  

<code>Promise&lt;void&gt;</code>

## TestFuncTwo  

**<code>TestFuncTwo(args: Generic, obj?: TestObj, desc?: boolean): string | string[] | null</code>**  

Test function two description.

### Parameters  
- **\`args\`** <code><a href="%url%/%temp_dir%/src/global/README.md#generic">Generic</a></code> required  
**Test** \`param\` *description* with [Link](https://test.docs).  
- **\`obj\`** <code><a href="#testobj">TestObj</a></code> optional  
- **\`desc\`** <code>boolean</code> optional  
Test desc param.  
Default: \`false\`

### Returns  

<code>string | string[] | null</code> - Test return description.

### Examples

#### Test function two example

Test function two example description.

\`\`\`js
import { TestFuncTwo } from '@test/test.js'

const test = TestFuncTwo({
  one: 'one'
  two: 2,
  three: []
})
\`\`\`

## Types

### TestConst  

**Type:** <code>10 | 20 | 30</code>

### TestLet  

**Type:** <code>object</code>

#### Properties  
- **\`lorem\`** <code>string</code> required  
- **\`ipsum\`** <code>string</code> required

### TestObj  

**Type:** <code>object</code>  

**Augments:** <code><a href="%url%/%temp_dir%/src/global/README.md#generic">Generic</a></code>

#### Properties  
- **\`str\`** <code>&#39;one&#39; | &#39;two&#39; | &#39;three&#39;</code> required  
Test str prop description.  
- **\`mix\`** <code>number | string | boolean</code> optional  
Test mix prop description.  
Default: \`0\`  
- **\`obj\`** <code>Object&lt;string, <a href="#testobj">TestObj</a>&gt;</code> optional  
- **\`ref\`** <code><a href="#testobj">TestObj</a></code> optional  
- **\`con\`** <code><a href="#testconst">TestConst</a></code> optional

### TestFunc  

**Type:** <code>function</code>

#### Parameters  
- **\`str\`** <code>string</code> required

#### Returns  

<code>Promise&lt;void&gt;</code>`,
      '/src/test/class/README.md': testReadMe['/src/test/class/README.md'] as string,
      '/src/test/const/README.md': testReadMe['/src/test/const/README.md'] as string
    }

    const expectedContents = expectedFiles.map(
      file => expectedReadMe[file]?.replace(/%temp_dir%/g, tempDir).replace(/%url%/g, '')
    )

    expect(files).toEqual(expectedFiles)
    expect(contents).toEqual(expectedContents)
  })

  it('should not create README files if empty source', async () => {
    await renderMarkdownDocs({
      srcDir,
      include: `${srcDir}/**/*Empty.ts`,
      exclude: `${srcDir}/**/*.test.ts`,
      docsExclude: `${srcDir}/**/*Types.ts`
    })

    const { files } = await testFiles('markdown')

    expect(files).toEqual([])
  })

  it('should not create README files if not TS or JS', async () => {
    await renderMarkdownDocs({
      srcDir,
      include: `${srcDir}/**/*.txt`
    })

    const { files } = await testFiles('markdown')

    expect(files).toEqual([])
  })

  it('should create index README file from JS source', async () => {
    await renderMarkdownDocs({
      srcDir,
      include: `${srcDir}/**/*.js`
    })

    const { files, contents } = await testFiles('markdown')
    const expectedFiles = ['/README.md']
    const expectedContents = [`# TestJs  

**<code>TestJs(): number</code>**  

Test JS description.

## Returns  

<code>number</code>`]

    expect(files).toEqual(expectedFiles)
    expect(contents).toEqual(expectedContents)
  })

  it('should exclude spec and mock files from README files', async () => {
    await writeFile(`${srcDir}/test/class/TestClass.spec.ts`, /* js */`
      /**
       * Test spec skip.
       *
       * @param {string} str
       * @return {string}
       */
      const testSpec = (str) => str
    `)

    await writeFile(`${srcDir}/test/TestMock.ts`, /* js */`
      /**
       * Test mock skip.
       *
       * @param {string} str
       * @return {string}
       */
      const testMock = (str) => str

      /* Exports */
      
      export { testMock }
    `)

    await renderMarkdownDocs({
      srcDir,
      include: `${srcDir}/**/*.ts`,
      exclude: [
        `${srcDir}/**/*.test.ts`,
        `${srcDir}/**/*.spec.ts`
      ],
      docsExclude: [
        `${srcDir}/**/*Types.ts`,
        `${srcDir}/**/*Mock.ts`
      ]
    })

    await rm(`${srcDir}/test/class/TestClass.spec.ts`)
    await rm(`${srcDir}/test/TestMock.ts`)

    const { files, contents } = await testFiles('markdown')
    const expectedFiles = [
      '/src/test/README.md',
      '/src/test/class/README.md',
      '/src/test/const/README.md'
    ]

    const expectedContents = expectedFiles.map(
      file => testReadMe[file]?.replace(/%temp_dir%/g, tempDir).replace(/%url%/g, '')
    )

    expect(files).toEqual(expectedFiles)
    expect(contents).toEqual(expectedContents)
  })

  it('should create README files only for class files', async () => {
    await renderMarkdownDocs({
      srcDir,
      include: `${srcDir}/**/*.ts`,
      exclude: `${srcDir}/**/*.test.ts`,
      docsExclude: `${srcDir}/**/*Types.ts`,
      docsInclude: `${srcDir}/**/*Class.ts`
    })

    const { files, contents } = await testFiles('markdown')
    const expectedFiles = ['/src/test/README.md', '/src/test/class/README.md']
    const expectedContents = [`# TestBaseClass  

Test class base description.

## Constructor  

**<code>new TestBaseClass(): TestBaseClass</code>**

## Properties

### init  

Test base initialize state.  

**Type:** <code>boolean</code>`,
      testReadMe['/src/test/class/README.md']?.replace(/%temp_dir%/g, tempDir).replace(/%url%/g, '')
    ]

    expect(files).toEqual(expectedFiles)
    expect(contents).toEqual(expectedContents)
  })
})

/* Test renderHtmlDocs */

describe('renderHtmlDocs()', () => {
  it('should create index, test, class and const HTML files', async () => {
    await renderHtmlDocs({
      srcDir,
      outDir,
      include: `${srcDir}/**/*.ts`,
      exclude: `${srcDir}/**/*.test.ts`,
      docsExclude: `${srcDir}/**/*Types.ts`,
      classPrefix: 'frm-',
      themes: {
        black: 'vitesse-black'
      },
      index
    })

    const { files, contents, styles, preClasses, spanClasses } = await testFiles('html')
    const expectedFiles = [
      '/docs/index.html',
      '/docs/test/class/index.html',
      '/docs/test/const/index.html',
      '/docs/test/index.html'
    ]

    const expectedContents = expectedFiles.map(
      file => testHtml[file]
        ?.replace(/%url%/g, '')
        .replace(/%h2_attr%/g, '')
        .replace(/%a_attr%/g, '')
        .replace(/\n/g, '')
        .trim()
    )

    expect(files).toEqual(expectedFiles)
    expect(contents).toEqual(expectedContents)
    expect(styles.every(style => style.startsWith('.frm-'))).toBe(true)
    expect(preClasses.every(preClass => preClass.includes('frm-') && preClass.includes('vitesse-black'))).toBe(true)
    expect(spanClasses.some(spanClass => spanClass.includes('frm-'))).toBe(true)
  })

  it('should create index without map and const HTML files', async () => {
    const titles: string[] = []
    const dirs: string[] = []

    await renderHtmlDocs({
      srcDir,
      outDir,
      include: `${srcDir}/test/const/TestConst.ts`,
      exclude: `${srcDir}/**/*.test.ts`,
      docsExclude: `${srcDir}/**/*Types.ts`,
      filterTitle (title, dir) {
        titles.push(title)
        dirs.push(dir)

        if (title === '') {
          return 'Index'
        }

        return title
      },
      index: `
      /**
       * Test Index
       *
       * @file
       */
      `
    })

    const { files, contents } = await testFiles('html')
    const expectedFiles = [
      '/docs/index.html',
      '/docs/test/const/index.html'
    ]

    const expectedHtml: Record<string, string> = {
      '/docs/index.html': `
<!DOCTYPE html>
<html lang="en">
<head>
<title>Index</title>
<style></style>
</head>
<body>
<h1 id="index">Index<a href="#index" aria-label="Permalink: Index">#</a></h1>
<p>Test Index</p>
</body>
</html>
`,
      '/docs/test/const/index.html': `
<!DOCTYPE html>
<html lang="en">
<head>
<title>TestConst</title>
<style></style>
</head>
<body>
<h1 id="testconst">TestConst<a href="#testconst" aria-label="Permalink: TestConst">#</a></h1>
<p>Test const description.</p>
<p><strong>Type:</strong> <code>TestConst</code></p>
</body>
</html>
      `
    }

    const expectedContents = expectedFiles.map(
      file => expectedHtml[file]
        ?.replace(/%url%/g, '')
        .replace(/%h2_attr%/g, '')
        .replace(/%a_attr%/g, '')
        .replace(/\n/g, '')
        .trim()
    )

    expect(files).toEqual(expectedFiles)
    expect(contents).toEqual(expectedContents)
    expect(titles).toEqual(['Const', ''])
    expect(dirs).toEqual(['const', ''])
  })

  it('should create test, class and const HTML files with filtered output and docs URL', async () => {
    const url = 'https://docs.com'
    const headings: Record<string, DocsHeading[]> = {}
    const slugs: Record<string, string> = {}

    let navigation: DocsNavigationItem[] = []

    await renderHtmlDocs({
      srcDir,
      outDir,
      url,
      include: `${srcDir}/**/*.ts`,
      exclude: `${srcDir}/**/*.test.ts`,
      docsExclude: `${srcDir}/**/*Types.ts`,
      filterAttr (attr, data, outerTag) {
        const newAttr = { ...attr }

        if (outerTag === 'h2') {
          newAttr['data-anchor'] = 'h2'
        }

        if (data.tag === 'h2') {
          newAttr['data-heading'] = ''
        }

        return newAttr
      },
      filterOutput (output, id, title, slug, navigationData, headingsData, css) {
        headings[id] = headingsData
        slugs[id] = slug
        navigation = navigationData

        return `<!DOCTYPE html><html lang="en"><head><title>${title}</title><style>${css}</style></head><body>${output}</body></html>`
      }
    })

    const { files, contents } = await testFiles('html')
    const expectedFiles = [
      '/docs/test/class/index.html',
      '/docs/test/const/index.html',
      '/docs/test/index.html'
    ]

    const expectedContents = expectedFiles.map(
      file => testHtml[file]
        ?.replace(/%url%/g, url)
        .replace(/%h2_attr%/g, ' data-heading=""')
        .replace(/%a_attr%/g, ' data-anchor="h2"')
        .replace(/\n/g, '')
        .trim()
    )

    const expectedHeadings = {
      '-test': [
        {
          children: [
            {
              id: 'examples',
              title: 'Examples',
              tag: 'h3'
            }
          ],
          id: 'testlet',
          title: 'TestLet',
          tag: 'h2'
        },
        {
          children: [
            {
              id: 'constructor',
              title: 'Constructor',
              tag: 'h3'
            },
            {
              children: [
                {
                  id: 'init',
                  title: 'init',
                  tag: 'h4'
                }
              ],
              id: 'properties',
              title: 'Properties',
              tag: 'h3'
            }
          ],
          id: 'testbaseclass',
          title: 'TestBaseClass',
          tag: 'h2'
        },
        {
          children: [
            {
              id: 'parameters',
              title: 'Parameters',
              tag: 'h3'
            },
            {
              id: 'yields',
              title: 'Yields',
              tag: 'h3'
            }
          ],
          id: 'testgenone',
          title: 'TestGenOne',
          tag: 'h2'
        },
        {
          children: [
            {
              id: 'yields-1',
              title: 'Yields',
              tag: 'h3'
            }
          ],
          id: 'testgentwo',
          title: 'TestGenTwo',
          tag: 'h2'
        },
        {
          children: [
            {
              id: 'parameters-1',
              title: 'Parameters',
              tag: 'h3'
            },
            {
              id: 'returns',
              title: 'Returns',
              tag: 'h3'
            }
          ],
          id: 'testfuncone',
          title: 'TestFuncOne',
          tag: 'h2'
        },
        {
          children: [
            {
              id: 'parameters-2',
              title: 'Parameters',
              tag: 'h3'
            },
            {
              id: 'returns-1',
              title: 'Returns',
              tag: 'h3'
            },
            {
              children: [
                {
                  id: 'test-function-two-example',
                  title: 'Test function two example',
                  tag: 'h4'
                }
              ],
              id: 'examples-1',
              title: 'Examples',
              tag: 'h3'
            }
          ],
          id: 'testfunctwo',
          title: 'TestFuncTwo',
          tag: 'h2'
        },
        {
          children: [
            {
              children: [
                {
                  id: 'properties-1',
                  title: 'Properties',
                  tag: 'h4'
                }
              ],
              id: 'testlet-1',
              title: 'TestLet',
              tag: 'h3'
            },
            {
              id: 'testconst',
              title: 'TestConst',
              tag: 'h3'
            },
            {
              children: [
                {
                  id: 'properties-2',
                  title: 'Properties',
                  tag: 'h4'
                }
              ],
              id: 'testobj',
              title: 'TestObj',
              tag: 'h3'
            }
          ],
          id: 'types',
          title: 'Types',
          tag: 'h2'
        }
      ],
      '-test-const': [],
      '-test-class': [
        {
          children: [
            {
              id: 'parameters',
              title: 'Parameters',
              tag: 'h3'
            }
          ],
          id: 'constructor',
          title: 'Constructor',
          tag: 'h2'
        },
        {
          children: [
            {
              id: 'props',
              title: 'props',
              tag: 'h3'
            }
          ],
          id: 'properties',
          title: 'Properties',
          tag: 'h2'
        },
        {
          children: [
            {
              children: [
                {
                  id: 'returns',
                  title: 'Returns',
                  tag: 'h4'
                }
              ],
              id: 'getprivateprop',
              title: 'getPrivateProp',
              tag: 'h3'
            },
            {
              children: [
                {
                  id: 'parameters-1',
                  title: 'Parameters',
                  tag: 'h4'
                },
                {
                  id: 'returns-1',
                  title: 'Returns',
                  tag: 'h4'
                }
              ],
              id: 'getprop',
              title: 'getProp',
              tag: 'h3'
            }
          ],
          id: 'methods',
          title: 'Methods',
          tag: 'h2'
        },
        {
          children: [
            {
              id: 'test-class-example',
              title: 'Test class example',
              tag: 'h3'
            }
          ],
          id: 'examples',
          title: 'Examples',
          tag: 'h2'
        }
      ]
    }

    const expectedSlugs = {
      '-test': '//test/',
      '-test-const': '//test/const/',
      '-test-class': '//test/class/'
    }

    const expectedNavigation = [
      {
        id: '-test',
        title: 'Test',
        link: '//test/',
        children: [
          {
            id: '-test-class',
            title: 'TestClass',
            link: '//test/class/'
          },
          {
            id: '-test-const',
            title: 'TestConst',
            link: '//test/const/'
          }
        ]
      }
    ]

    expect(files).toEqual(expectedFiles)
    expect(contents).toEqual(expectedContents)
    expect(headings).toEqual(expectedHeadings)
    expect(slugs).toEqual(expectedSlugs)
    expect(navigation).toEqual(expectedNavigation)
  })
})
