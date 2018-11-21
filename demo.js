const Editor = require('.')
const h = require('mutant/html-element')
const Value = require('mutant/value')
const watch = require('mutant/watch')
const setStyle = require('module-styles')('tre-json-editor-demo')

require('brace/theme/solarized_dark')

setStyle(`
  .tre-json-editor {
    max-width: 500px;
  }
`)

const renderEditor = Editor(null, {
  ace: {
    theme: 'ace/theme/solarized_dark',
    tabSize: 2,
    useSoftTabs: true
  },
  save: content => {
    console.log('new content', content)
  }
})

const kv = {
  key: 'fake-key',
  value: {
    content: {
      type: 'style',
      css: 'Hello World'
    }
  }
}

function UpdateStream(obs) {
  let seq = 0
  let oldContent = Object.assign({}, obs())
  watch(obs, content => {
    console.log('UPDATE:', oldContent, content)
    oldContent = Object.assign({}, content)
    seq++
  })
}

const contentObs = Value(kv.value.content)
const updates = UpdateStream(contentObs)

document.body.appendChild(
  renderEditor(kv, {contentObs})
)
