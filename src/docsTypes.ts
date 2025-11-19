/**
 * Docs - Types
 */

/* Imports */

import type { ShikiTransformerStyleToClass } from '@shikijs/transformers'

/**
 * @typedef {object} DocsRenderType
 * @prop {'html'|'markdown'} ref
 */
export interface DocsRenderType {
  ref: 'html' | 'markdown'
}

/**
 * @typedef {object} DocsShikiOptions
 * @prop {Object<string, string>} themes
 * @prop {ShikiTransformerStyleToClass} [toClass]
 */
export interface DocsShikiOptions {
  themes: Record<string, string>
  toClass: ShikiTransformerStyleToClass
}

/**
 * @typedef {Object<string, string>} DocsGeneric
 */
type DocsGeneric = Record<string, string>

/**
 * @typedef {object} DocsSymbols
 * @extends {DocsGeneric}
 * @prop {string} h1
 * @prop {string} h2
 * @prop {string} h3
 * @prop {string} h4
 * @prop {string} h5
 * @prop {string} h6
 * @prop {string} strong
 * @prop {string} code
 * @prop {string} li
 * @prop {string} hr
 * @prop {string} p
 */
export interface DocsSymbols extends DocsGeneric {
  h1: string
  h2: string
  h3: string
  h4: string
  h5: string
  h6: string
  strong: string
  code: string
  li: string
  hr: string
  p: string
}

/**
 * @typedef {'function'|'typedef'|'class'|'member'|'file'|'constant'} DocsKind
 */
export type DocsKind = 'function' | 'typedef' | 'class' | 'member' | 'file' | 'constant'

/**
 * @typedef {'h2'|'h3'|'h4'|'h5'|'h6'} DocsTag
 */
export type DocsTag = 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

/**
 * @typedef {object} DocsJsDocTypeNames
 * @prop {string[]} names
 */
export interface DocsJsDocTypeNames {
  names: string[]
}

/**
 * @typedef {object} DocsJsDocType
 * @prop {string} name
 * @prop {DocsJsDocTypeNames} type
 * @prop {string} [description]
 * @prop {boolean} [optional]
 * @prop {*} [defaultvalue]
 */
export interface DocsJsDocType {
  name: string
  type: DocsJsDocTypeNames
  description?: string
  optional?: boolean
  defaultvalue?: unknown
}

/**
 * @typedef {object} DocsJsDocMetaCode
 * @prop {string} [name]
 */
interface DocsJsDocMetaCode {
  name?: string
}

/**
 * @typedef {object} DocsJsDocMeta
 * @prop {string} filename
 * @prop {string} [filenameOut]
 * @prop {number} [lineno]
 * @prop {number} [columnno]
 * @prop {string} [path]
 * @prop {DocsJsDocMetaCode} [code]
 */
export interface DocsJsDocMeta {
  filename: string
  filenameOut?: string
  lineno?: number
  columnno?: number
  path?: string
  code?: DocsJsDocMetaCode
}

/**
 * @typedef {object} DocsJsDocsTag
 * @prop {string} originalTitle
 * @prop {string} title
 * @prop {string} text
 * @prop {string} value
 */
export interface DocsJsDocsTag {
  originalTitle: string
  title: string
  text: string
  value: string
}

/**
 * @typedef {object} DocsJsDocItem
 * @prop {string} name
 * @prop {string} longname
 * @prop {DocsKind} kind
 * @prop {'global'} scope
 * @prop {DocsJsDocMeta} [meta]
 * @prop {string} [description]
 * @prop {string} [classdesc]
 * @prop {DocsJsDocType[]} [params]
 * @prop {DocsJsDocType[]} [returns]
 * @prop {DocsJsDocType[]} [properties]
 * @prop {DocsJsDocType[]} [yields]
 * @prop {DocsJsDocTypeNames} [type]
 * @prop {string[]} [augments]
 * @prop {string} [memberof]
 * @prop {boolean} [undocumented]
 * @prop {'private'} [access]
 * @prop {DocsJsDocsTag[]} [tags]
 * @prop {string[]} [examples]
 */
export interface DocsJsDocItem {
  name: string
  longname: string
  kind: DocsKind
  scope: 'global'
  meta?: DocsJsDocMeta
  description?: string
  classdesc?: string
  params?: DocsJsDocType[]
  returns?: [DocsJsDocType]
  properties?: DocsJsDocType[]
  yields?: [DocsJsDocType]
  type?: DocsJsDocTypeNames
  augments?: string[]
  memberof?: string
  undocumented?: boolean
  access?: 'private'
  tags?: DocsJsDocsTag[]
  examples?: string[]
}

/**
 * @typedef {object} DocsType
 * @prop {string} name
 * @prop {string[]} type
 * @prop {string} [dir]
 * @prop {string} [outDir]
 * @prop {string} [id]
 * @prop {string} [description]
 * @prop {boolean} [optional]
 * @prop {string} [defaults]
 * @prop {DocsType[]} [props]
 * @prop {DocsType[]} [params]
 * @prop {string[]} [augments]
 * @prop {DocsReturn} [returns]
 * @prop {string[]} [examples]
 */
export interface DocsType {
  name: string
  type: string[]
  dir?: string
  outDir?: string
  id?: string
  description?: string
  optional?: boolean
  defaults?: string
  props?: DocsType[]
  params?: DocsType[]
  augments?: string[]
  returns?: DocsReturn
  examples?: string[]
}

/**
 * @typedef {object} DocsClass
 * @prop {string} name
 * @prop {string[]} type
 * @prop {string} [dir]
 * @prop {string} [outDir]
 * @prop {string} [id]
 * @prop {string} [description]
 * @prop {string} [desc] - Constructor description.
 * @prop {DocsType[]} [params] - Constructor parameters.
 * @prop {string[]} [augments]
 * @prop {Array<DocsType|DocsFunction>} [members]
 * @prop {string[]} [examples]
 */
export interface DocsClass {
  name: string
  type: string[]
  dir?: string
  outDir?: string
  id?: string
  description?: string
  desc?: string
  params?: DocsType[]
  augments?: string[]
  members?: Array<DocsType | DocsFunction>
  examples?: string[]
}

/**
 * @typedef {object} DocsReturn
 * @prop {string[]} type
 * @prop {string} [description]
 */
export interface DocsReturn {
  type: string[]
  description?: string
}

/**
 * @typedef {object} DocsFunction
 * @prop {string} name
 * @prop {DocsReturn} [returns]
 * @prop {string} [description]
 * @prop {DocsType[]} [params]
 * @prop {DocsReturn} [yields]
 * @prop {string[]} [examples]
 * @prop {string} [type]
 */
export interface DocsFunction {
  name: string
  returns?: DocsReturn
  description?: string
  params?: DocsType[]
  yields?: DocsReturn
  examples?: string[]
  type?: string
}

/**
 * @typedef {object} DocsOutputRef
 * @prop {string} ref
 */
export interface DocsOutputRef {
  ref: string
}

/**
 * @typedef {object} DocsContent
 * @prop {string|DocsContent[]} content - Plain text or nested HTML content.
 * @prop {string} [tag] - HTML element tag.
 * @prop {string} [link] - Anchor link to type definition.
 */
export interface DocsContent {
  content: string | DocsContent[]
  tag?: string
  link?: string
}

/**
 * @typedef {Object<string, DocsContent>} DocsResult
 */
export type DocsResult = Record<string, DocsContent>

/**
 * @typedef {object} DocsIndexItem
 * @prop {string} title
 * @prop {string} link
 */
export interface DocsIndexItem {
  title: string
  link: string
}

/**
 * @typedef {object} DocsNavigationItem
 * @prop {string} id
 * @prop {string} title
 * @prop {string} link
 * @prop {DocsNavigationItem[]} [children]
 */
export interface DocsNavigationItem {
  id: string
  title: string
  link: string
  children?: DocsNavigationItem[]
}

/**
 * @typedef {object} DocsHeading
 * @prop {string} id
 * @prop {string} tag
 * @prop {string} title
 * @prop {DocsHeading[]} [children]
 */
export interface DocsHeading {
  id: string
  tag: string
  title: string
  children?: DocsHeading[]
}

/**
 * @typedef {object} DocsHeadingsRef
 * @prop {DocsHeading[]} ref
 */
export interface DocsHeadingsRef {
  ref: DocsHeading[]
}

/**
 * @typedef {function} DocsFilterAttr
 * @param {Object<string, string>} attr - Element attributes as key-value pairs.
 * @param {DocsContent} data - Element tag and content.
 * @param {string} outerTag - Parent element tag.
 * @return {Object<string, string>}
 */
export type DocsFilterAttr = (
  attr: Record<string, string>,
  data: DocsContent,
  outerTag: string
) => Record<string, string>

/**
 * @typedef {function} DocsFilterOutput
 * @param {string} output - HTML output.
 * @param {string} id - Kebab case of file path.
 * @param {string} title - File title.
 * @param {string} slug - File path as link.
 * @param {DocsNavigationItem[]} navigation - Objects matching directory stucture in alphabetical order.
 * @param {DocsHeading[]} headings - File headings as nested object stucture.
 * @param {string} [css] - CSS output by [Shiki](https://shiki.style/packages/transformers#transformerstyletoclass).
 * @return {string}
 */
export type DocsFilterOutput = (
  output: string,
  id: string,
  title: string,
  slug: string,
  navigation: DocsNavigationItem[],
  headings: DocsHeading[],
  css?: string
) => string

/**
 * @typedef {function} DocsFilterTitle
 * @param {string} title
 * @param {string} dir
 */
export type DocsFilterTitle = (title: string, dir: string) => string

/**
 * @typedef {object} DocsArgs
 * @prop {string|string[]} include - Glob pattern of files to include in types.
 * @prop {string|string[]} [exclude] - Glob pattern of files to exclude from types.
 * @prop {string|string[]} [docsInclude] - Glob pattern of files to include in result.
 * @prop {string|string[]} [docsExclude] - Glob pattern of files to exclude from result.
 * @prop {string|string[]} [docsTypes] - Glob pattern of type definition files.
 * @prop {string} [srcDir=src] - Source directory of input files.
 * @prop {string} [outDir] - Directory to write documentation files to.
 * @prop {string} [url] - Repository URL for Markdown docs or site URL for HTML docs.
 * @prop {string} [index] - Comments representing index documentation page.
 * @prop {DocsFilterTitle} [filterTitle] - Customize title for multi file directories.
 */
export interface DocsArgs {
  include: string | string[]
  exclude?: string | string[]
  docsInclude?: string | string[]
  docsExclude?: string | string[]
  docsTypes?: string | string[]
  srcDir?: string
  outDir?: string
  url?: string
  index?: string
  filterTitle?: DocsFilterTitle
}

/**
 * @typedef {object} DocsHtmlArgs
 * @extends {DocsArgs}
 * @prop {string} [outDir=docs] - Directory to write documentation files to.
 * @prop {Object<string, string>} [themes] - Themes to pass to [Shiki](https://shiki.style/) for syntax highlighting.
 * @prop {string} [classPrefix] - Prefix classes output by [Shiki Transformer](https://shiki.style/packages/transformers/).
 * @prop {DocsFilterAttr} [filterAttr] - Customize HTML element attributes.
 * @prop {DocsFilterOutput} [filterOutput] - Customize HTML output.
 */
export interface DocsHtmlArgs extends DocsArgs {
  themes?: Record<string, string>
  classPrefix?: string
  filterAttr?: DocsFilterAttr
  filterOutput?: DocsFilterOutput
}

/**
 * Info return type.
 */
export type DocsInfo<K = DocsKind> = 
  K extends 'function' ? DocsFunction :
  K extends 'typedef' ? DocsType :
  K extends 'class' ? DocsClass :
  never;

/**
 * All doc types.
 */
export type DocsAll = DocsType & DocsFunction & DocsClass

/**
 * Partial doc types.
 */
export type DocsAllPartial = Partial<DocsAll> & Pick<DocsAll, 'name' | 'type'>
