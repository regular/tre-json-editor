const h = require('mutant/html-element')
const Value = require('mutant/value')
const computed = require('mutant/computed')
const watch = require('mutant/watch')
const setStyle = require('module-styles')('tre-json-editor')
const ace = require('brace')
const deepEqual = require('deep-equal')
const patch = require('./patch')
require('brace/mode/json')

const {diff} = require('json8-patch')

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
    editor.$blockScrolling = Infinity
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
      let oldContent
      try {
        oldContent = JSON.parse(editor.session.getValue())
      } catch(e) {
        return console.error(e)
      }
      if (deepEqual(newContent, oldContent)) return
      const operations = diff(oldContent, newContent) 
      console.warn(operations)
      let text = editor.session.getValue()
      const newText = patch(text, operations)

      const currentPosition = editor.selection.getCursor()
      const scrollTop = editor.session.getScrollTop()
      editor.session.setValue(newText)
      editor.clearSelection()
      editor.gotoLine(currentPosition.row + 1, currentPosition.column);
      editor.session.setScrollTop(scrollTop)
    }

    const abort = watch(value, newContent => {
      setNewContent(newContent)
    })

    return h('.tre-json-editor', {
      hooks: [el => abort],
      attributes: {
        'data-key': kv.key
      }
    }, [
      pre,
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

