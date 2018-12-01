module.exports = function(ast, path, opts) {
  opts = opts || {}
  path = path.slice(0)
  if (ast.type == 'Object') {
    return locateProperty(ast, path, opts)
  }
  if (ast.type == 'Array') {
    return locateItem(ast, path, opts)
  }
}
  
function locateProperty(ast, path, opts) {
  if (!path.length) return ast.loc
  const first = path.shift()  // also removes first item from path
  if (!ast.children || !ast.children.length) return
  let i = 0
  const prop = ast.children.find( ({type, key}) => {
    const found = type == 'Property' && key.type == 'Identifier' && key.value == first
    if (!found) i++
    return found
  })
  if (!prop) return
  if (!path.length) {
    const ret = Object.assign({}, opts.value ? prop.value.loc : prop.loc)
    if (i > 0) ret.before = ast.children[i-1].loc
    if (i < ast.children.length - 1) ret.after = ast.children[i+1].loc
    return ret
  }
  if (prop.value.type == 'Object') return locateProperty(prop.value, path, opts)
  if (prop.value.type == 'Array') return locateItem(prop.value, path, opts)
}

function locateItem(ast, path, opts) {
  if (!path.length) return ast.loc
  const first = path.shift()  // also removes first item from path
  if (!/^[0-9]+$/.test(first)) return
  const i = Number(first)
  if (!(ast.children && ast.children.length > i)) return
  const item = ast.children[i]
  if (!path.length) {
    const ret = Object.assign({}, item.loc)
    if (i > 0) ret.before = ast.children[i-1].loc
    if (i < ast.children.length - 1) ret.after = ast.children[i+1].loc
    return ret
  }
  if (item.type == 'Object') return locateProperty(item, path, opts)
  if (item.type == 'Array') return locateItem(item, path, opts)
}
