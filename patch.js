const getAST = require('json-to-ast')
const pointer = require('json8-pointer')
const locateProperty = require('./locate-property')

// TODO: detect formatting style of parent object for 'add'

/*
 * Add: add a value into an object or array.
 * Remove: remove a value from an object or array.
 * Replace: replaces a value. Logically identical to using remove and then add.
 * Copy: copy a value from one path to another by adding the value at a specified to another location.
 * Move: moves a value from one place to another by removing from one location and adding to another.
 */

module.exports = function patch(text, operations) {
  for(let {op, from, path, value} of operations) {
    let ast = getAST(text, {loc: true})
    path = pointer.decode(path)
    //console.warn(op, path, value)
    let newText
    if (op == 'copy') {
      value = pointer.find(JSON.parse(text), from)
      newText = patch(text, [{op: 'add', path, value}])
    } else if (op == 'move') {
      //console.log('from', from)
      value = pointer.find(JSON.parse(text), from)
      newText = patch(text, [
        {op: 'remove', path: from},
        {op: 'add', path, value}
      ])
    } else if (op == 'add') {
      let parent_loc = ast.loc
      if (path.length > 1) {
        // fitst make sure, the parents exists
        for(let i=0; i < path.length - 1; ++i) {
          const p = path.slice(0, i + 1)
          parent_loc = locateProperty(ast, p, {value: true})
          if (!parent_loc) {
            const next = path[i+1]
            const isIndex = /[0-9]+/.test(next)
            if (isIndex) {
              text = patch(text, [{op: 'add', path: p, value: [] }])
            } else {
              text = patch(text, [{op: 'add', path: p, value: {} }])
            }
            ast = getAST(text, {loc: true})
            parent_loc = locateProperty(ast, p, {value: true})
          }
        }
      }
      // we now have the parent's location in parent_loc
      const name = path.slice(-1)[0]
      const parent = JSON.parse(
        text.substr(parent_loc.start.offset, parent_loc.end.offset - parent_loc.start.offset)
      )
      const isEmpty = Object.keys(parent).length == 0
      const isArray = Array.isArray(parent)
      if (!isArray && parent.hasOwnProperty(name)) {
        throw new Error('Cannot add duplicate key: ' + name)
      }
      let v = JSON.stringify(value)
      if (!isArray) v = `${JSON.stringify(name)}: ` + v
      if (isArray && !isEmpty && name !== '-') v = v + ', '
      else if (!isEmpty) v = ', ' + v

      let prolog, epilog
      // default: insert right before closing token
      prolog = text.substr(0, parent_loc.end.offset - 1)
      epilog = text.substr(parent_loc.end.offset - 1)
      if (isArray && name !== '-') {
        const loc = locateProperty(ast, path)
        if (loc) {
          prolog = text.substr(0, loc.start.offset)
          epilog = text.substr(loc.start.offset)
        }
      }
      newText = prolog + v + epilog
    } else if (op == 'replace') {
      const loc = locateProperty(ast, path, {value: true})
      const before = text.substr(0, loc.start.offset)
      const after = text.substr(loc.end.offset)
      newText = `${before}${JSON.stringify(value)}${after}`
    } else if (op == 'remove') {
      const loc = locateProperty(ast, path)
      let prolog, epilog
      if (!loc.before && !loc.after) {
        // {"xxx": 1}         if we are the only child, we are fine
        prolog = text.substr(0, loc.start.offset)
        epilog = text.substr(loc.end.offset)
      } else if (!loc.after && loc.before) {
        // {"a": 1, "xxx": 2} if we are the last child,
        // we need to delete backwards to the end of the previous sibling
        prolog = text.substr(0, loc.before.end.offset)
        epilog = text.substr(loc.end.offset)
      } else {
        // otherwise, we need to delete up to the beginning of the next sibling
        prolog = text.substr(0, loc.start.offset)
        epilog = text.substr(loc.after.start.offset)
      }
      newText = `${prolog}${epilog}`
    } else {
      throw new Error('Unsupported operation: ' + op)
    }
    //console.log('new text', newText)
    text = newText
  }
  return text
}
