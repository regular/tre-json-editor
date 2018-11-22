const h = require('mutant/html-element')
const Value = require('mutant/value')
const computed = require('mutant/computed')
const setStyle = require('module-styles')('tre-json-editor')
const ace = require('brace')
require('brace/mode/json')

module.exports = function RenderEditor(ssb, opts) {
  opts = opts || {}

  setStyle(`
    .tre-json-editor pre.editor {
      width: 90%;
      min-height: 200px;
    }
  `)

  return function renderEditor(kv, ctx) {
    ctx = ctx || {}
    const content = kv.value && kv.value.content
    const json = JSON.stringify(content, null, 2)
    const pre = h('pre.editor', json)

    const annotation = Value()
    const syntaxError = Value()
    const value = ctx.contentObs || Value(content)
    const problem = computed([annotation, syntaxError], (a, e) => {
      return a || e
    })

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

    return h('.tre-json-editor', {
      attributes: {
        'data-key': kv.key
      }
    }, [
      pre,
      h('button', {
        'ev-click': e => {
          if (opts.save) opts.save(value())
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

