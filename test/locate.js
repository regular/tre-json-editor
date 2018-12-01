const getAST = require('json-to-ast')
const locateProperty = require('../locate-property')
const test = require('tape')

test('root object', t => {
  const json = '{ "a": 1 }'
  const ast = getAST(json, {loc: true})
  let loc = locateProperty(ast, [])
  t.equal(loc.start.offset, 0)
  t.equal(loc.end.offset, 10)
  t.notOk(loc.before)
  t.notOk(loc.after)
  t.end()
})

test('property of root', t => {
  const json = '{ "a": 1 }'
  const ast = getAST(json, {loc: true})
  let loc = locateProperty(ast, ['a'])
  t.equal(loc.start.offset, 2)
  t.equal(loc.end.offset, 8)
  t.notOk(loc.before)
  t.notOk(loc.after)
  t.end()
})

test('nested property (1st level)', t => {
  const json = '{ "a": { "b": 2 } }'
  const ast = getAST(json, {loc: true})
  let loc = locateProperty(ast, ['a', 'b'])
  t.equal(loc.start.offset, 9)
  t.equal(loc.end.offset, 15)
  t.notOk(loc.before)
  t.notOk(loc.after)
  t.end()
})

test('nested property (2nd level)', t => {
  const json = '{ "a": { "b": { "ccc": 3 } } }'
  const ast = getAST(json, {loc: true})
  let loc = locateProperty(ast, ['a', 'b', 'ccc'])
  t.equal(loc.start.offset, 16)
  t.equal(loc.end.offset, 24)
  t.notOk(loc.before)
  t.notOk(loc.after)
  t.end()
})

test('nested property (2nd child)', t => {
  const json = '{ "a": { "b": 2, "ccc": "hello" } }'
  const ast = getAST(json, {loc: true})
  let loc = locateProperty(ast, ['a', 'ccc'])
  t.equal(loc.start.offset, 17)
  t.equal(loc.end.offset, 31)
  t.ok(loc.before)
  t.notOk(loc.after)
  t.end()
})

test('Array item (middle)', t => {
  const json = '[1,2,3]'
  const ast = getAST(json, {loc: true})
  let loc = locateProperty(ast, [1])
  t.equal(loc.start.offset, 3)
  t.equal(loc.end.offset, 4)
  t.ok(loc.before)
  t.ok(loc.after)
  t.end()
})

test('Nested array item (first)', t => {
  const json = '[1, ["2", 3], 4]'
  const ast = getAST(json, {loc: true})
  let loc = locateProperty(ast, [1,0])
  t.equal(loc.start.offset, 5)
  t.equal(loc.end.offset, 8)
  t.notOk(loc.before)
  t.ok(loc.after)
  t.end()
})

test('Object in array', t => {
  const json = '["hi",{"a": "elfo"},3]'
  const ast = getAST(json, {loc: true})
  let loc = locateProperty(ast, [1,'a'])
  t.equal(loc.start.offset, 7)
  t.equal(loc.end.offset, 18)
  t.notOk(loc.before)
  t.notOk(loc.after)
  t.end()
})

test('Array in object', t => {
  const json = '{"a": [true, false]}'
  const ast = getAST(json, {loc: true})
  let loc = locateProperty(ast, ["a",1])
  t.equal(loc.start.offset, 13)
  t.equal(loc.end.offset, 18)
  t.ok(loc.before)
  t.notOk(loc.after)
  t.end()
})

test('Complex', t => {
  const json = '[1,{"a": [true, {"b": [true, false]}]}]'
  const ast = getAST(json, {loc: true})
  let loc = locateProperty(ast, [1,"a",1,"b",0])
  t.equal(loc.start.offset, 23)
  t.equal(loc.end.offset, 27)
  t.notOk(loc.before)
  t.ok(loc.after)
  t.end()
})
