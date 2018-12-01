const patch = require('../patch')
const test = require('tape')

test('replace', t => {
  const text = '{"a":   1}'
  t.equal(patch(text, [
    {op: 'replace', path: '/a', value: 2}
  ]), '{"a":   2}')
  t.end()
})

test('remove first propery', t => {
  const text = '{"a": 1, "b":  2, "c":   3}'
  t.equal(patch(text, [
    {op: 'remove', path: '/a'}
  ]), '{"b":  2, "c":   3}')
  t.end()
})

test('remove last propery', t => {
  const text = '{"a": 1, "b":  2, "c":   3}'
  t.equal(patch(text, [
    {op: 'remove', path: '/c'}
  ]), '{"a": 1, "b":  2}')
  t.end()
})

test('remove middle propery', t => {
  const text = '{"a": 1, "b":  2, "c":   3}'
  t.equal(patch(text, [
    {op: 'remove', path: '/b'}
  ]), '{"a": 1, "c":   3}')
  t.end()
})

test('Add to empty object', t => {
  const text = '{}'
  t.equal(patch(text, [
    {op: 'add', path: '/a', value: 1}
  ]), '{"a": 1}')
  t.end()
})

test('Add to nexted empty object', t => {
  const text = '{"a": {}}'
  t.equal(patch(text, [
    {op: 'add', path: '/a/b', value: 2}
  ]), '{"a": {"b": 2}}')
  t.end()
})

test('Add to non-existing object', t => {
  const text = '{}'
  t.equal(patch(text, [
    {op: 'add', path: '/a/b', value: 2}
  ]), '{"a": {"b": 2}}')
  t.end()
})

test('Add to non-existing array', t => {
  const text = '{}'
  t.equal(patch(text, [
    {op: 'add', path: '/a/0', value: 2}
  ]), '{"a": [2]}')
  t.end()
})

test('Add to non-existing nested array', t => {
  const text = '{}'
  t.equal(patch(text, [
    {op: 'add', path: '/a/0/0', value: 2}
  ]), '{"a": [[2]]}')
  t.end()
})

test('Add to non-existing nested object', t => {
  const text = '{}'
  t.equal(patch(text, [
    {op: 'add', path: '/a/b/c', value: 2}
  ]), '{"a": {"b": {"c": 2}}}')
  t.end()
})

test('Add to non empty object', t => {
  const text = '{"a": 1}'
  t.equal(patch(text, [
    {op: 'add', path: '/b', value: 2}
  ]), '{"a": 1, "b": 2}')
  t.end()
})

test('Try to add duplicate key', t => {
  const text = '{"a": 1}'
  t.throws( ()=>{
    patch(text, [
      {op: 'add', path: '/a', value: 2}
    ])
  })
  t.end()
})

test('Add item to end of array', t => {
  const text = '[1, 2]'
  t.equal( patch(text, [
    {op: 'add', path: '/-', value: 3}
  ]), '[1, 2, 3]')
  t.end()
})

test('Add item to beginning of array', t => {
  const text = '[1, 2]'
  t.equal( patch(text, [
    {op: 'add', path: '/0', value: 0}
  ]), '[0, 1, 2]')
  t.end()
})

test('Insert item between two items', t => {
  const text = '[1, 3]'
  t.equal( patch(text, [
    {op: 'add', path: '/1', value: true}
  ]), '[1, true, 3]')
  t.end()
})

test('Move item in array', t => {
  const text = '[1, 3]'
  t.equal( patch(text, [
    {op: 'move', from: '/0', path: '/-'}
  ]), '[3, 1]')
  t.end()
})

test('Copy item in array', t => {
  const text = '[1, 3]'
  t.equal( patch(text, [
    {op: 'copy', from: '/0', path: '/-'}
  ]), '[1, 3, 1]')
  t.end()
})
