const h = require('mutant/html-element')
const Value = require('mutant/value')
const computed = require('mutant/computed')
const setStyle = require('module-styles')('tre-json-editor')
const ace = require('brace')
require('brace/mode/json')

const getAST = require('json-to-ast')
const {diff} = require('json8-patch')
const pointer = require('json8-pointer')
const locateProperty = require('./locate-property')

module.exports = function RenderEditor(ssb, opts) {
  opts = opts || {}

  setStyle(`
    .tre-json-editor pre.editor {
      width: 100%;
      min-height: 200px;
    }
  `)

  return function renderEditor(kv, ctx) {
    ctx = ctx || {}
    const content = kv.value && kv.value.content
    const json = JSON.stringify(content, null, 2)
    const pre = h('pre.editor', json)

    const annotation = Value()
    const syntaxError = ctx.syntaxErrorObs || Value()
    const value = ctx.contentObs || Value(content)
    const problem = computed([annotation, syntaxError], (a, e) => {
      return a || e
    })

    value.set(content)
    const editor = ace.edit(pre)
    if (opts.ace) editor.setOptions(opts.ace)
    editor.session.setMode('ace/mode/json')

    editor.session.on('change', Changes(editor, 600, (err, content) => {
      syntaxError.set(err && err.message)
      if (!err) value.set(content)
    }))
    
    editor.session.on('changeAnnotation', () => {
      const ans = editor.session.getAnnotations()
      if (ans.length !== 0) {
        annotation.set(ans[0].text)
      } else {
        annotation.set(null)
      }
    })

    function setNewContent(newContent) {
      const oldContent = value()
      const operations = diff(oldContent, newContent) 
      console.warn(operations)
      let text = editor.session.getValue()
      const ast = getAST(text, {loc: true})

      for(let {op, path, value} of operations) {
        path = pointer.decode(path)
        console.warn(op, path, value)
        let newText
        if (op == 'replace') {
          const loc = locateProperty(ast, path)
          const before = text.substr(0, loc.start.offset)
          const after = text.substr(loc.end.offset)
          newText = before +
            `${
              JSON.stringify(path.slice(-1)[0])
            }: ${
              JSON.stringify(value)
            }` + after
          console.log('new text', newText)
        } else {
          throw new Error('Unsupported operation: ' + op)
        }
        text = newText
      }
      editor.session.setValue(text)
      value.set(newContent)
    }

    return h('.tre-json-editor', {
      attributes: {
        'data-key': kv.key
      }
    }, [
      pre,
      h('button', {
        'ev-click': e => {
          if (opts.save) {
            const content = Object.assign({}, value())
            opts.save({
              key: kv.key,
              value: {
                content
              }
            }, (err, new_kv) => {
              if (err) return
              kv = new_kv
              const newContent = kv.value.content
              setNewContent(newContent)
            })
          }
        }
      }, 'Apply'),
      h('span', problem)
    ])
  }
}

// -- utils

function Changes(editor, ms, cb) {
  return debounce(ms, ()=>{
    const v = editor.session.getValue() 
    let content
    try {
      content = JSON.parse(v)
    } catch(err) {
      return cb(err)
    }
    cb(null, content)
  })
}

function debounce(ms, f) {
  let timerId

  return function() {
    if (timerId) clearTimeout(timerId)
    timerId = setTimeout(()=>{
      timerid = null
      f()
    }, ms)
  }
}

