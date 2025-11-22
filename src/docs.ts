/**
 * Docs
 *
 * @file
 * title: Formation Docs
 * Utilities to generate Markdown or HTML documentation files from JSDoc comments in JavaScript or TypeScript files.
 *
 * @example
 * title: Installation
 * shell: npm install -D @alanizcreative/formation-docs
 */

/* Imports */

import type {
  DocsRenderType,
  DocsShikiOptions,
  DocsSymbols,
  DocsArgs,
  DocsHtmlArgs,
  DocsResult,
  DocsJsDocItem,
  DocsJsDocType,
  DocsType,
  DocsFunction,
  DocsClass,
  DocsReturn,
  DocsKind,
  DocsInfo,
  DocsContent,
  DocsOutputRef,
  DocsTag,
  DocsAll,
  DocsAllPartial,
  DocsFilterAttr,
  DocsIndexItem,
  DocsNavigationItem,
  DocsHeading,
  DocsHeadingsRef
} from './docsTypes.js'
import type { CodeToHastOptions } from 'shiki'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname, join, basename, extname } from 'node:path'
import { transformerStyleToClass } from '@shikijs/transformers'
import { codeToHtml } from 'shiki'
import { glob } from 'glob'
import jsdoc from 'jsdoc-api'
import ts from 'typescript'

/**
 * Current render type.
 *
 * @private
 * @type {object}
 * @prop {DocsRenderType} [ref]
 */
const renderType: DocsRenderType = {
  ref: 'html'
}

/**
 * Shiki syntax highlighter options.
 *
 * @private
 * @type {DocsShikiOptions}
 */
const shikiOptions: DocsShikiOptions = {
  themes: {
    dark: 'vitesse-dark',
    light: 'vitesse-light'
  },
  toClass: transformerStyleToClass()
}

/**
 * Markdown symbol from HTML tag.
 *
 * @private
 * @type {DocsSymbols}
 */
const tagToSymbol: DocsSymbols = {
  h1: '# ',
  h2: '\n\n## ',
  h3: '\n\n### ',
  h4: '\n\n#### ',
  h5: '\n\n##### ',
  h6: '\n\n###### ',
  strong: '**',
  code: '`',
  li: '  \n- ',
  hr: '\n***',
  p: '  \n'
}

/**
 * Heading tags and levels.
 *
 * @private
 * @type {Map<string, number>}
 */
const headingInfo = new Map([
  ['h1', 1],
  ['h2', 2],
  ['h3', 3],
  ['h4', 4],
  ['h5', 5],
  ['h6', 6]
])

/**
 * Escape to HTML entities.
 *
 * @private
 * @param {string} value
 * @return {string}
 */
const escape = (value: string): string => {
  const entities = new Map([
    ['&', '&amp;'],
    ['<', '&lt;'],
    ['>', '&gt;'],
    ['"', '&quot;'],
    ["'", '&#39;'],
    ['*', '&ast;']
  ])

  return value.replace(/[&<>"'*]/g, (char) => {
    return entities.get(char) as string // Cast as characters in regex match keys in map
  })
}

/**
 * Convert to title case.
 *
 * @private
 * @param {string} value
 * @return {string}
 */
const titleCase = (value: string): string => {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase())
}

/**
 * Convert basic Markdown (bold, italic, code and link) to HTML.
 * 
 * @private
 * @param {string} value
 * @return {string}
 */
const markdownToHtml = (value: string): string => {
  return value
    // Bold **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code `code`
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
}

/**
 * Flatten type objects to strings.
 *
 * @private
 * @param {string[]} types
 * @return {string[]}
 */
const normalizeTypes = (types: string[]): string[] => {
  return types.map(name => {
    return name.replace(/Array\.<(.+)>/, '$1[]').replace(/.</g, '<')
  })
}

/**
 * Flatten types in params.
 *
 * @private
 * @param {DocsJsDocType[]} params
 * @return {DocsType[]}
 */
const normalizeParams = (params: DocsJsDocType[]): DocsType[] => {
  return params.map(param => {
    const { name, description, optional, defaultvalue } = param

    const docType: DocsType = {
      name,
      type: normalizeTypes(param.type.names)
    }

    if (description) {
      docType.description = description
    }

    if (optional) {
      docType.optional = optional
    }

    if (defaultvalue !== undefined) {
      docType.defaults = String(defaultvalue as number) // Cast for defaults like null, 0, false
    }

    return docType
  })
}

/**
 * Flatten types in returns.
 *
 * @private
 * @param {DocsJsDocType} item
 * @return {DocsReturn}
 */
const normalizeReturn = (item: DocsJsDocType): DocsReturn => {
  const { description } = item

  const docsReturn: DocsReturn = {
    type: normalizeTypes(item.type.names)
  }

  if (description) {
    docsReturn.description = description
  }

  return docsReturn
}

/**
 * Flatten and optionally fetch file examples.
 *
 * @private
 * @param {string[]} examples
 * @param {string} dir
 * @param {DocsTag} [tag='h2']
 * @return {Promise<DocsContent[]|string>}
 */
const normalizeExamples = async (
  examples: string[],
  dir: string,
  tag: DocsTag = 'h2'
): Promise<DocsContent[] | string> => {
  const newExamples: string[] = []
  const newContent: DocsContent[] = []
  const isHtml = renderType.ref === 'html'

  for (const example of examples) {
    const regex = /^(?:title:\s*(.+?)\n)?(?:desc:\s*(.+?)\n)?(?:(shell|json|javascript|typescript|js|ts):\s*)?([\s\S]*)$/
    const match = example.match(regex) as RegExpMatchArray // Cast as regex always matches
    const title = match[1]
    const desc = match[2]
    const lang = match[3]
    let code = match[4] // Captures remaining content

    if (code?.startsWith('.')) {
      code = await readFile(resolve(dir, code), 'utf8')
    }

    let newExample = ''

    if (title) {
      newExample += (tagToSymbol[tag]).replace('\n', '') + title + '\n'

      newContent.push({
        content: title,
        tag
      })
    }

    if (desc) {
      newExample += '\n' + desc + '\n'

      newContent.push({
        content: desc,
        tag: 'p'
      })
    }

    if (lang && code) {
      newExample += '\n' + '```' + lang + '\n' + code + '\n' + '```'

      if (isHtml) {
        const shikiArgs: CodeToHastOptions = {
          lang,
          defaultColor: false,
          transformers: [shikiOptions.toClass],
          themes: shikiOptions.themes
        }

        const content = await codeToHtml(code, shikiArgs)

        newContent.push({ content })
      }
    }

    if (!newExample) {
      continue
    }

    newExamples.push(newExample)
  }

  if (isHtml) {
    return newContent.length ? newContent : ''
  }

  return newExamples.length ? '\n' + newExamples.join('\n') : ''
}

/**
 * Create kebab case ID from type name.
 *
 * @private
 * @param {string} name
 * @return {string}
 */
const getId = (name: string): string => {
  return name
    .trim()
    .replace(/[^\w\s]|_/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
}

/**
 * Recursively link doc types and generate content objects.
 *
 * @private
 * @param {string[]} type
 * @param {Map<string, DocsType>} docTypes
 * @param {DocsType} currentDocType
 * @param {DocsContent[]} types
 * @param {Set<string>} usedTypes
 * @param {string} dir
 * @param {string} url
 * @return {Promise<DocsContent[]>}
 */
const getContent = async (
  type: string[],
  docTypes: Map<string, DocsType>,
  currentDocType: DocsType,
  types: DocsContent[],
  usedTypes: Set<string>,
  dir: string,
  url: string,
  _content: DocsContent[] = []
): Promise<DocsContent[]> => {
  for (const typeName of type) {
    const typeMatches =
      typeName.match(/\b(?!(?:Promise|Object|Array|Map|Set|Function|function|string|number|boolean|void|null|undefined))\w+\b/g)

    if (!typeMatches) {
      if (_content.length) {
        _content.push({ content: ' | ' })
      }

      _content.push({ content: escape(typeName) })

      continue
    }

    const allMatches = typeName.match(/(\W)|([A-Za-z]|\d)\w*/g)?.filter(Boolean) as string[]
    const content: DocsContent[] = []

    for (const match of allMatches) {
      if (!typeMatches.includes(match)) {
        content.push({ content: escape(match) })

        continue
      }

      const docType = docTypes.get(match)

      if (!docType) {
        content.push({ content: escape(match) })

        continue
      }

      const {
        name: docTypeName,
        dir: docTypeDir,
        outDir: docTypeOutDir,
        id: docTypeId
      } = docType

      let link = `#${docTypeId}`

      if (docTypeDir && dir !== docTypeDir) {
        link = `${url}/${docTypeOutDir || docTypeDir}/${renderType.ref === 'markdown' ? 'README.md' : ''}#${docTypeId}`
      }

      content.push({
        tag: 'a',
        content: docTypeName,
        link
      })

      if (docType === currentDocType) { // Avoid infinite loop from circular types
        continue
      }

      if (!usedTypes.has(docTypeName)) {
        usedTypes.add(docTypeName)
        types.push(...await getTypeContent(docType, 'typedef', docTypes, types, usedTypes, dir, url, 2))
      }
    }

    if (_content.length) {
      _content.push({ content: ' | ' })
    }

    _content.push({ content })
  }

  return _content
}

/**
 * Convert nested types to content objects.
 *
 * @private
 * @param {DocsType|DocsFunction|DocsClass} info
 * @param {'function'|'typedef'|'class'} kind
 * @param {Map<string, DocsType>} docTypes
 * @param {DocsContent[]} types
 * @param {Set<string>} usedTypes
 * @param {string} dir
 * @param {string} url
 * @param {number} [depth=1]
 * @return {Promise<DocsContent[]>}
 */
const getTypeContent = async (
  info: DocsType | DocsFunction | DocsClass,
  kind: DocsKind,
  docTypes: Map<string, DocsType>,
  types: DocsContent[],
  usedTypes: Set<string>,
  dir: string,
  url: string,
  depth: number = 1,
  _content: DocsContent[] = []
): Promise<DocsContent[]> => {
  const isType = kind === 'typedef'
  const isFunction = kind === 'function'
  const isClass = kind === 'class'
  const isHtml = renderType.ref === 'html'

  let newInfo = info as DocsAllPartial

  if (isFunction) {
    const funcType = docTypes.get(newInfo.type || '')

    if (funcType) {
      newInfo = {
        ...funcType as DocsAllPartial,
        ...newInfo
      }
    }
  }

  const {
    name,
    description,
    desc,
    type,
    props,
    params,
    returns,
    augments,
    members,
    examples,
    yields
  } = newInfo

  if (isType && newInfo.dir !== dir) {
    return _content
  }

  _content.push({
    tag: `h${depth + 1}`,
    content: name
  })

  if (isClass) {
    if (description) {
      _content.push({
        tag: 'p',
        content: description
      })
    }

    _content.push({
      tag: `h${depth + 2}`,
      content: 'Constructor'
    })
  }

  if (isFunction || isClass) {
    const paramsList: string[] = []
    const returnsList: string[] = []

    params?.forEach(param => {
      const {
        name: paramName,
        type: paramType,
        optional: paramOpt
      } = param

      paramsList.push(`${paramName}${paramOpt ? '?' : ''}: ${paramType.join(' | ')}`)
    })

    returns?.type.forEach(returnType => {
      returnsList.push(returnType)
    })
    
    _content.push({
      tag: 'p',
      content: [
        {
          tag: 'strong',
          content: [
            {
              tag: 'code',
              content: [ // Ensure code tag instead of symbol in Markdown
                {
                  content: `${isClass ? 'new ' : ''}${name}(${escape(paramsList.join(', '))}): ${isClass ? name : escape(returnsList.join(' | '))}`
                }
              ]
            }
          ]
        }
      ]
    })
  }

  if (isClass && desc) {
    _content.push({
      tag: 'p',
      content: desc
    })
  }

  if (!isClass && description) {
    _content.push({
      tag: 'p',
      content: description
    })
  }

  if (isType) {
    const typeCodes = await getContent(type, docTypes, info as DocsAll, types, usedTypes, dir, url)

    _content.push({
      tag: 'p',
      content: [
        {
          tag: 'strong',
          content: 'Type:'
        },
        {
          content: ' '
        },
        {
          tag: 'code',
          content: typeCodes
        }
      ]
    })
  }

  if (augments) {
    _content.push({
      tag: 'p',
      content: [
        {
          tag: 'strong',
          content: 'Augments:'
        },
        {
          content: ' '
        },
        {
          tag: 'code',
          content: await getContent(augments, docTypes, info as DocsAll, types, usedTypes, dir, url)
        }
      ]
    })
  }

  if (props?.length) {
    _content.push({
      tag: `h${depth + 2}`,
      content: 'Properties'
    })

    const propsList: DocsContent[] = []

    for (const prop of props) {
      const {
        name: propName,
        type: propType,
        optional: propOpt,
        description: propDesc,
        defaults: propDef
      } = prop

      const propsContent: DocsContent[] = []
      const propsDetails: DocsContent[] = []
      const propsTerm = [
        {
          tag: 'strong',
          content: [
            {
              tag: 'code',
              content: propName
            }
          ]
        },
        {
          content: ' '
        },
        {
          tag: 'code',
          content: await getContent(propType, docTypes, info as DocsAll, types, usedTypes, dir, url)
        },
        {
          content: ' '
        },
        {
          content: propOpt ? 'optional' : 'required'
        }
      ]

      if (isHtml) {
        propsContent.push({
          tag: 'dt',
          content: propsTerm
        })
      } else {
        propsContent.push(...propsTerm)
      }

      if (propDesc) {
        propsDetails.push({
          tag: 'p',
          content: propDesc
        })
      }

      if (propDef) {
        propsDetails.push({
          tag: 'p',
          content: [
            {
              content: 'Default: '
            },
            {
              tag: 'code',
              content: propDef
            }
          ]
        })
      }

      if (isHtml) {
        propsContent.push({
          tag: 'dd',
          content: propsDetails
        })
      } else {
        propsContent.push(...propsDetails)
      }
  
      propsList.push({
        tag: isHtml ? 'div' : 'li',
        content: propsContent
      })
    }

    _content.push({
      tag: isHtml ? 'dl' : 'ul',
      content: propsList
    })
  }

  if (params?.length) {
    _content.push({
      tag: `h${depth + (isClass ? 3 : 2)}`,
      content: 'Parameters'
    })

    const paramsList: DocsContent[] = []

    for (const param of params) {
      const {
        name: paramName,
        type: paramType,
        optional: paramOpt,
        description: paramDesc,
        defaults: paramDef
      } = param

      const paramContent: DocsContent[] = []
      const paramDetails: DocsContent[] = []
      const paramTerm = [
        {
          tag: 'strong',
          content: [
            {
              tag: 'code',
              content: paramName
            }
          ]
        },
        {
          content: ' '
        },
        {
          tag: 'code',
          content: await getContent(paramType, docTypes, info as DocsAll, types, usedTypes, dir, url)
        },
        {
          content: ' '
        },
        {
          content: paramOpt ? 'optional' : 'required'
        }
      ]

      if (isHtml) {
        paramContent.push({
          tag: 'dt',
          content: paramTerm
        })
      } else {
        paramContent.push(...paramTerm)
      }

      if (paramDesc) {
        paramDetails.push({
          tag: 'p',
          content: paramDesc
        })
      }

      if (paramDef) {
        paramDetails.push({
          tag: 'p',
          content: [
            {
              content: 'Default: '
            },
            {
              tag: 'code',
              content: paramDef
            }
          ]
        })
      }

      if (isHtml) {
        paramContent.push({
          tag: 'dd',
          content: paramDetails
        })
      } else {
        paramContent.push(...paramDetails)
      }

      paramsList.push({
        tag: isHtml ? 'div' : 'li',
        content: paramContent
      })
    }

    _content.push({
      tag: isHtml ? 'dl' : 'ul',
      content: paramsList
    })
  }

  if (returns) {
    _content.push({
      tag: `h${depth + 2}`,
      content: 'Returns'
    })

    const returnsContent: DocsContent[] = [
      {
        tag: 'code',
        content: await getContent(returns.type, docTypes, info as DocsAll, types, usedTypes, dir, url)
      }
    ]

    if (returns.description) {
      returnsContent.push(
        {
          content: ' '
        },
        {
          content: returns.description
        }
      )
    }

    _content.push({
      tag: 'p',
      content: returnsContent
    })
  }

  if (yields) {
    _content.push({
      tag: `h${depth + 2}`,
      content: 'Yields'
    })

    const yieldsContent: DocsContent[] = [
      {
        tag: 'code',
        content: await getContent(yields.type, docTypes, info as DocsAll, types, usedTypes, dir, url)
      }
    ]

    if (yields.description) {
      yieldsContent.push(
        {
          content: ' '
        },
        {
          content: yields.description
        }
      )
    }

    _content.push({
      tag: 'p',
      content: yieldsContent
    })
  }

  if (isClass && members) {
    let hasPropsTitle = false
    let hasMethodsTitle = false

    for (const member of members) {
      const { params: memberParams } = member as DocsAll
      const memberIsFunction = memberParams != null

      if (!hasPropsTitle && !memberIsFunction) {
        hasPropsTitle = true

        _content.push({
          tag: `h${depth + 2}`,
          content: 'Properties'
        })
      }

      if (!hasMethodsTitle && memberIsFunction) {
        hasMethodsTitle = true

        _content.push({
          tag: `h${depth + 2}`,
          content: 'Methods'
        })
      }

      _content.push(
        ...await getTypeContent(
          member,
          memberIsFunction ? 'function' : 'typedef',
          docTypes,
          types,
          usedTypes,
          dir,
          url,
          depth + 2
        )
      )
    }
  }

  if (examples) {
    const examplesContent = await normalizeExamples(examples, dir, `h${depth + 3}` as DocsTag)

    if (!examplesContent) {
      return _content
    }

    _content.push({
      tag: `h${depth + 2}`,
      content: 'Examples'
    })

    _content.push({
      content: examplesContent
    })
  }

  return _content
}

/**
 * Info object by kind.
 *
 * @private
 * @param {DocsJsDocItem} item
 * @param {'function'|'typedef'|'class'} kind
 * @return {DocsType|DocsFunction|DocsClass}
 */
const getInfo = <K extends DocsKind>(item: DocsJsDocItem, kind: K): DocsInfo<K> => {
  const {
    name,
    returns,
    description,
    type,
    classdesc,
    properties,
    augments,
    params = [], // Always exists for functions not classes or types
    examples,
    yields,
    meta
  } = item

  /* Kind */

  const isType = kind === 'typedef'
  const isFunction = kind === 'function'

  /* Function */

  if (isFunction && type) {
    return {
      name,
      description,
      examples,
      type: normalizeTypes(type.names)[0]
    } as DocsInfo<K>
  }

  if (isFunction) {
    const info: DocsFunction = {
      name,
      params: normalizeParams(params)
    }

    if (returns) {
      info.returns = normalizeReturn(returns[0])
    }

    if (description) {
      info.description = description
    }

    if (yields) {
      info.yields = normalizeReturn(yields[0])
    }

    if (examples) {
      info.examples = examples
    }

    return info as DocsInfo<K>
  }

  /* Typedef */

  if (isType && type) {
    const info: DocsType = {
      name,
      id: getId(name),
      type: normalizeTypes(type.names),
      dir: meta?.filename
    }

    if (meta?.filenameOut) {
      info.outDir = meta.filenameOut
    }

    if (description) {
      info.description = description
    }

    if (properties) {
      info.props = normalizeParams(properties)
    }

    if (item.params) {
      info.params = normalizeParams(params)
    }

    if (returns) {
      info.returns = normalizeReturn(returns[0])
    }

    if (augments) {
      info.augments = augments
    }

    if (examples) {
      info.examples = examples
    }

    return info as DocsInfo<K>
  }

  /* Class */

  const info: DocsClass = {
    name,
    type: [],
    id: getId(name),
    dir: meta?.filename,
    members: []
  }

  if (meta?.filenameOut) {
    info.outDir = meta.filenameOut
  }

  if (classdesc) {
    info.description = classdesc
  }

  if (description) {
    info.desc = description
  }

  if (augments) {
    info.augments = augments
    info.type = augments
  }

  if (item.params) {
    info.params = normalizeParams(params)
  }

  if (examples) {
    info.examples = examples
  }

  return info as DocsInfo<K>
}

/**
 * Generate Markdown output.
 *
 * @private
 * @param {DocsContent} data
 * @param {string} outerTag
 * @return {string}
 */
const getMarkdown = (data: DocsContent, outerTag: string, _output: DocsOutputRef = { ref: '' }): string => {
  const { content, tag, link } = data

  const itemTag = tag || ''
  const isArr = Array.isArray(content)
  const isStr = typeof content === 'string'
  const isSummary = tag === 'summary'
  const isDetails = tag === 'details'
  const isCode = tag === 'code'

  let symbol = tagToSymbol[itemTag] || ''
  let endSymbol = isCode || tag === 'strong' ? symbol : ''

  if (link && tag === 'a') {
    symbol = `<a href="${link}">`
    endSymbol = '</a>'
  }

  if (isDetails || isSummary) {
    symbol = `\n<${tag}>`
    endSymbol = `${isDetails ? '\n\n' : ''}</${tag}>${isSummary ? '\n' : ''}`
  }

  if (isArr && isCode) {
    symbol = '<code>'
    endSymbol = '</code>'
  }

  _output.ref += symbol

  if (itemTag === 'p' && outerTag !== 'li') {
    _output.ref += '\n'
  }

  if (isArr) {
    content.forEach(item => {
      getMarkdown(item, itemTag, _output)
    })
  }

  if (isStr) {
    _output.ref += content
  }

  _output.ref += endSymbol

  return _output.ref
}

/**
 * Generate HTML output.
 * 
 * @private
 * @param {DocsContent} data
 * @param {DocsFilterAttr} filterAttr
 * @param {string} outerTag
 * @param {DocsOutputRef} title
 * @param {DocsHeadingsRef} headings
 * @return {string}
 */
const getHtml = (
  data: DocsContent,
  filterAttr: DocsFilterAttr,
  outerTag: string,
  title: DocsOutputRef = { ref: '' },
  headings: DocsHeadingsRef = { ref: [] },
  _output: DocsOutputRef = { ref: '' },
  _ids: Set<string> = new Set()
): string => {
  const { content, tag, link } = data
  const isArr = Array.isArray(content)
  const isStr = typeof content === 'string'
  const isHeading = tag && headingInfo.has(tag)
  const isLink = link && tag === 'a'
  const isHeadingLink = isLink && headingInfo.has(outerTag) && isStr

  if (isStr && !content || isArr && !content.length) {
    return _output.ref
  }

  let attrs = ''
  let attr: Record<string, string> = {}
  let id = ''

  if (isHeading && isStr) {
    id = getId(content)

    if (_ids.has(id)) {
      let suffix = 1
      let newId = `${id}-${suffix}`

      while (_ids.has(newId)) {
        suffix += 1
        newId = `${id}-${suffix}`
      }

      id = newId
    }

    attr.id = id

    if (tag === 'h1') {
      title.ref = content
    } else {
      const headingsLen = headings.ref.length
      const headingLevel = headingInfo.get(tag) as number // Cast as heading check confirms tag exists
      const headingData = {
        id,
        title: content,
        tag
      }

      _ids.add(id)

      if (headingLevel === 2) {
        headings.ref.push(headingData)
      }
      
      if (headingLevel > 2 && headingsLen) {
        const targetLevel = headingLevel - 1

        let parent = headings.ref[headingsLen - 1] as DocsHeading // Cast as length guarantees existence 
        let parentLevel = headingInfo.get(parent.tag) as number // Cast as parent confirms tag exists

        while (parentLevel < targetLevel && parent.children?.length) {
          parent = parent.children[parent.children.length - 1] as DocsHeading // Cast as length guarantees existence 
          parentLevel = headingInfo.get(parent.tag) as number // Cast as parent confirms tag exists
        }

        if (!parent.children) {
          parent.children = []
        }

        parent.children.push(headingData)
      }
    }
  }

  if (isLink) {
    attr.href = link
  }

  if (isHeadingLink) {
    attr['aria-label'] = content
  }

  attr = filterAttr(attr, data, outerTag)

  for (const [key, value] of Object.entries(attr)) {
    attrs += ` ${key}="${value}"`
  }

  let opening = tag ? `<${tag}${attrs}>` : ''
  let closing = tag ? `</${tag}>` : ''

  if (link && tag === 'a') {
    opening = `<a${attrs}>`
    closing = '</a>'
  }

  _output.ref += opening

  if (isArr) {
    content.forEach(item => {
      getHtml(item, filterAttr, outerTag, title, headings, _output, _ids)
    })
  }

  if (isStr) {
    _output.ref += isHeadingLink ? '#' : markdownToHtml(content)

    if (isHeading) {
      getHtml(
        {
          content: `Permalink: ${content}`,
          tag: 'a',
          link: `#${id}`
        },
        filterAttr,
        tag,
        title,
        headings,
        _output,
        _ids
      )
    }
  }

  _output.ref += closing

  return _output.ref
}

/**
 * Rich text objects from source code and JSDoc explain.
 *
 * @example
 * ts: ./getDocs.txt
 * @param {DocsArgs} args
 * @return {Promise<DocsResult>}
 */
const getDocs = async (args: DocsArgs): Promise<DocsResult> => {
  /* Args */

  const {
    include,
    exclude,
    docsInclude,
    docsExclude,
    docsTypes,
    url = '',
    srcDir = 'src',
    outDir,
    index,
    filterTitle
  } = args

  /* Result */

  const result: DocsResult = {}

  /* Files to include in result */

  const resultExclude: string[] = []
  const resultTypes: string[] = docsTypes ? await glob(docsTypes) : []

  if (exclude) {
    resultExclude.push(...(Array.isArray(exclude) ? exclude : [exclude]))
  }

  if (docsExclude) {
    resultExclude.push(...(Array.isArray(docsExclude) ? docsExclude : [docsExclude]))
  }

  const resultFiles = await glob(docsInclude || include, { ignore: resultExclude })

  /* JSDoc items */

  const jsdocItems: DocsJsDocItem[] = []

  /* Export counts */

  const exports: Map<string, number> = new Map()

  /* Source files */

  const sourceFiles = await glob(include, { ignore: exclude })
  const sources: Map<string, DocsJsDocItem[]> = new Map()

  for (const file of sourceFiles) {
    const ext = extname(file)
    const dir = dirname(file)
    const isTs = ext === '.ts'
    const isJs = ext === '.js'

    if (!isTs && !isJs) {
      continue
    }

    const text = await readFile(file, 'utf8')
    const isResFile = resultFiles.includes(file)
    const isTypeFile = resultTypes.includes(file)

    let output = isJs ? text : ''

    if ((isTs && !isResFile) || isTypeFile) {
      const comments = text.match(/\/\*\*[\s\S]*?\*\//g)

      if (comments) {
        output = comments.join('\n')
      }
    }

    if (isTs && isResFile && !isTypeFile) {
      const transpiled = ts.transpileModule(text, { compilerOptions: {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        declaration: true,
        removeComments: false
      }})

      output = transpiled.outputText
    }

    const docItems = await jsdoc.explain({ source: output }) as DocsJsDocItem[]
    const newDocItems = docItems.map(docItem => {
      docItem.meta = {
        ...docItem.meta,
        filename: dir
      }

      if (outDir) {
        docItem.meta.filenameOut = dir.replace(`${srcDir}/`, '')
      }

      return docItem
    })

    jsdocItems.push(...newDocItems)

    if (!isResFile) {
      continue
    }

    const allDocItems = [
      ...(sources.get(dir) || []),
      ...newDocItems
    ]

    sources.set(dir, allDocItems)
    exports.set(dir, allDocItems.filter(item => item.meta?.code?.name?.includes('export')).length)
  }

  /* Index info */

  const indexMap: Map<string, DocsIndexItem[]> = new Map()

  if (index) {
    sources.set(srcDir, await jsdoc.explain({ source: index }) as DocsJsDocItem[])
  }

  /* Normalize JSDoc types from all sources */

  const docTypes: Map<string, DocsType> = new Map()
  const docVars: Map<string, DocsType> = new Map()
  const docFunctions: Map<string, DocsFunction> = new Map()
  const docClasses: Map<string, DocsClass> = new Map()

  jsdocItems.forEach(item => {
    const {
      name,
      kind,
      type,
      memberof,
      undocumented,
      access
    } = item

    if (access === 'private' || undocumented) {
      return
    }

    const isClassMember = !!memberof

    if (isClassMember && !docClasses.has(memberof)) {
      docClasses.set(memberof, {
        name: memberof,
        type: [],
        members: []
      })
    }

    if (kind === 'typedef' && type) {
      docTypes.set(name, getInfo(item, 'typedef'))
    }

    if (kind === 'class') {
      const classInfo = getInfo(item, 'class')
      const jsDocClass = docClasses.get(name)
      const newInfo = { ...classInfo, ...jsDocClass }

      newInfo.type = classInfo.type

      docClasses.set(name, newInfo)
      docTypes.set(name, newInfo)
    }

    if (kind === 'constant') {
      docVars.set(name, getInfo(item, 'typedef'))
    }

    if (kind === 'member') {
      const typeInfo = getInfo(item, 'typedef')

      if (isClassMember) {
        docClasses.get(memberof)?.members?.push(typeInfo)
      } else {
        docVars.set(name, typeInfo)
      }
    }

    if (kind === 'function') {
      const functionInfo = getInfo(item, 'function')

      if (isClassMember) {
        docClasses.get(memberof)?.members?.push(functionInfo)
      } else {
        docFunctions.set(name, functionInfo)
      }
    }
  })

  /* Organize types, classes and functions by source directory */

  for (const [dir, dirDocItems] of sources) {
    const vars: DocsContent[] = []
    const types: DocsContent[] = []
    const classes: DocsContent[] = []
    const functions: DocsContent[] = []
    const usedVars: Set<string> = new Set()
    const usedTypes: Set<string> = new Set()
    const usedClasses: Set<string> = new Set()
    const usedFunctions: Set<string> = new Set()
    const single = exports.get(dir) === 1
    const isIndex = dir === srcDir && !!index

    let title: string | undefined
    let desc: string | undefined
    let guide: DocsContent[] | string = ''
    let hasIndex = false

    for (const item of dirDocItems) {
      const { name, kind, description, examples, access, undocumented, tags } = item

      if (access === 'private' || undocumented) {
        continue
      }

      if (isIndex && tags && tags[0]?.title === 'index') {
        hasIndex = true
      }

      if (kind === 'file') {
        desc = description

        const regex = /^(?:title:\s*(.+?)\n)?([\s\S]*)$/
        const match = desc?.match(regex) as RegExpMatchArray // Cast as regex always matches

        title = match[1]
        desc = match[2]

        if (examples) {
          guide = await normalizeExamples(examples, dir)
        }
      }

      if (kind === 'typedef') {
        const info = docTypes.get(name)

        if (info && !usedTypes.has(name)) {
          usedTypes.add(name)
          types.push(...await getTypeContent(info, 'typedef', docTypes, types, usedTypes, dir, url, 2))
        }
      }

      if (kind === 'member' || kind === 'constant') {
        const info = docVars.get(name)

        if (info && !usedVars.has(name)) {
          usedVars.add(name)
          vars.push(...await getTypeContent(info, 'typedef', docTypes, types, usedTypes, dir, url, single ? 0 : 1))
        }
      }

      if (kind === 'function') {
        const info = docFunctions.get(name)

        if (info && !usedFunctions.has(name)) {
          usedFunctions.add(name)
          functions.push(...await getTypeContent(info, kind, docTypes, types, usedTypes, dir, url, single ? 0 : 1))
        }
      }

      if (kind === 'class') {
        const info = docClasses.get(name)

        if (info && !usedClasses.has(name)) {
          usedClasses.add(name)
          classes.push(...await getTypeContent(info, kind, docTypes, types, usedTypes, dir, url, single ? 0 : 1))
        }
      }
    }

    const hasVars = vars.length > 0
    const hasTypes = types.length > 0
    const hasClasses = classes.length > 0
    const hasFunctions = functions.length > 0

    if (!hasVars && !hasTypes && !hasClasses && !hasFunctions && !isIndex) {
      continue
    }

    if (hasTypes) {
      types.unshift({
        tag: 'h2',
        content: 'Types'
      })
    }

    const dirBase = basename(dir.replace(srcDir, ''))
    const dirTitleCase = titleCase(dirBase)
    const dirTitle = (!single || !isIndex) && typeof filterTitle === 'function' ? filterTitle(dirTitleCase, dirBase) : dirTitleCase
    const guides: DocsContent[] = []

    if (!single) {
      guides.push({
        tag: 'h1',
        content: title || dirTitle
      })

      if (desc) {
        guides.push({
          tag: 'p',
          content: desc
        })
      }

      guides.push({
        content: guide
      })
    }

    if (isIndex && hasIndex && indexMap.size) {
      guides.push({
        tag: 'h2',
        content: 'Index'
      })

      const orderedKeys = [...indexMap.keys()].sort()

      orderedKeys.forEach(key => {
        const values = indexMap.get(key) as DocsIndexItem[] // Cast as map size indicates values exist

        guides.push({
          tag: 'details',
          content: [
            {
              tag: 'summary',
              content: titleCase(key)
            },
            {
              tag: 'ul',
              content: values.sort((a, b) => a.title.localeCompare(b.title)).map(value => {
                return {
                  tag: 'li',
                  content: [
                    {
                      tag: 'a',
                      content: value.title,
                      link: value.link
                    }
                  ]
                }
              })
            }
          ]
        })
      })
    }

    if (!isIndex) {
      const sectionDir = dir.replace(`${srcDir}/`, '').split('/')[0] || ''

      if (!indexMap.has(sectionDir)) {
        indexMap.set(sectionDir, [])
      }

      indexMap.get(sectionDir)?.push({
        title: dirTitle,
        link: `${url}/${outDir ? dir.replace(`${srcDir}/`, '') : dir}/${renderType.ref === 'markdown' ? 'README.md' : ''}`
      })
    }

    result[dir] = {
      content: [
        ...guides,
        ...vars,
        ...classes,
        ...functions,
        ...types
      ]
    }
  }

  /* Output */

  return result
}

/**
 * Output normalized JSDoc data as Markdown files.
 *
 * @example
 * js: import { renderMarkdownDocs } from '@alanizcreative/formation-docs/docs.js'
 * 
 * await renderMarkdownDocs({
 *   include: 'src/**\/*.ts',
 *   exclude: [
 *     'src/**\/*.test.ts',
 *     'src/**\/*Mock.ts'
 *   ],
 *   docsInclude: 'src/form/**\/*.ts',
 *   docsExclude: 'src/**\/*Types.ts'
 * })
 * 
 * // src/button/button.ts
 * // src/button/buttonTypes.ts
 * // src/form/__tests__/form.test.ts
 * // src/form/form.ts
 * // src/form/README.md
 * // src/form/formMock.ts
 * // src/form/formTypes.ts
 * @param {DocsArgs} args
 * @return {Promise<void>}
 */
const renderMarkdownDocs = async (args: DocsArgs): Promise<void> => {
  /* Set type */

  renderType.ref = 'markdown'

  /* Data */

  const docs = await getDocs(args)

  /* Create files */

  const {
    srcDir = 'src',
    outDir = ''
  } = args

  for (const [dir, data] of Object.entries(docs)) {
    await writeFile(resolve(join(outDir, dir, dir === srcDir ? '..' : '', 'README.md')), getMarkdown(data, ''))
  }
}

/**
 * Output normalized JSDoc data as HTML files.
 *
 * @example
 * js: import { renderHtmlDocs } from '@alanizcreative/formation-docs/docs.js'
 * 
 * await renderHtmlDocs({
 *   outDir: 'docs',
 *   include: 'src/**\/*.ts',
 *   exclude: 'src/**\/*.test.ts',
 *   docsExclude: 'src/**\/*Types.ts',
 *   url: 'https://docs.formation.org'
 * })
 * 
 * // src/button/button.ts
 * // src/button/buttonTypes.ts
 * // src/form/__tests__/form.test.ts
 * // src/form/form.ts
 * // src/form/formTypes.ts
 * // docs/button/index.html
 * // docs/form/index.html
 * @param {DocsHtmlArgs} args
 * @return {Promise<void>}
 */
const renderHtmlDocs = async (args: DocsHtmlArgs): Promise<void> => {
  /* Set type */

  renderType.ref = 'html'

  /* Set options */

  const {
    srcDir = 'src',
    outDir = 'docs',
    themes,
    classPrefix,
    filterOutput
  } = args

  let { filterAttr } = args

  if (themes) {
    shikiOptions.themes = themes
  }

  if (classPrefix) {
    shikiOptions.toClass = transformerStyleToClass({ 
      classPrefix
    })
  }

  /* Data */

  const docs = await getDocs(args)
  const docsEntries = Object.entries(docs)

  /* Filter */

  if (typeof filterAttr !== 'function') {
    filterAttr = (attr) => attr
  }

  /* Create output and navigation */

  const navigationMap: Map<string, DocsNavigationItem> = new Map()
  const navigationSlugs: string[] = []
  const navigation: DocsNavigationItem[] = []
  const items: Map<string, [string, string, string, string, DocsHeading[], string]> = new Map()

  await mkdir(outDir, { recursive: true })

  for (const [dir, data] of docsEntries) {
    const relDir = dir.replace(srcDir, '')
    const slug = `/${relDir}/`
    const id = relDir.replace(/\//g, '-')
    const path = resolve(join(outDir, relDir, 'index.html'))

    if (relDir) {
      await mkdir(dirname(path), { recursive: true })
    }

    const title = { ref: '' }
    const headings = { ref: [] }
    const css = shikiOptions.toClass.getCSS()
    const output = getHtml(data, filterAttr, '', title, headings)

    items.set(path, [output, id, title.ref, slug, headings.ref, css])

    if (relDir) {
      navigationSlugs.push(slug)
      navigationMap.set(slug, {
        id,
        title: title.ref,
        link: slug
      })
    }
  }

  navigationSlugs.sort()

  for (const slug of navigationSlugs) {
    const children: DocsNavigationItem[] = []
    const item = navigationMap.get(slug)

    navigationSlugs.forEach(s => {
      if (s.startsWith(slug) && s !== slug) {
        children.push(navigationMap.get(s) as DocsNavigationItem) // Cast as items keys and slug array match
        navigationMap.delete(s)
      }
    })

    if (!item) {
      continue
    }

    if (children.length) {
      item.children = children
    }

    navigation.push(item)
  }

  /* Create files */

  for (const [path, data] of items) {
    const [output, id, title, slug, headings, css] = data
    let newOutput = ''

    if (typeof filterOutput === 'function') {
      newOutput = filterOutput(output, id, title, slug, navigation, headings, css)
    } else {
      newOutput = `<!DOCTYPE html><html lang="en"><head><title>${title}</title><style>${css}</style></head><body>${output}</body></html>`
    }

    await writeFile(path, newOutput)
  }
}

/* Exports */

export {
  getDocs,
  renderMarkdownDocs,
  renderHtmlDocs
}
