// import test from 'tape'
// import html from '../../html.js'
// import render from '../../render.js'
// import { Component } from '../../component.js'

var test = require('tape')
var { html, render } = require('../../nanohtml')

test('renders html', function (t) {
  var el = render(html`<span>Hello ${'planet'}!</span>`)
  t.ok(el instanceof window.Element, 'renders an element')
  t.equal(el.innerText, 'Hello planet!', 'renders partials')
  t.end()
})

test('renders nested html', function (t) {
  var el = render(html`<span>Hello ${html`<span>planet</span>`}!</span>`)
  t.equal(el.childElementCount, 1, 'has children')
  t.equal(el.firstElementChild.innerText, 'planet', 'children rendered')
  t.end()
})

test('renders array of children', function (t) {
  var el = render(html`<span>Hello ${[html`<span>planet</span>`]}!</span>`)
  t.equal(el.childElementCount, 1, 'has children')
  t.equal(el.firstElementChild.innerText, 'planet', 'children rendered')
  t.end()
})

test('can mount in DOM', function (t) {
  var id = makeID()
  var div = document.createElement('div')
  div.innerHTML = '<span><span>Hi <strong>world</strong>!</span></span>'
  var firstChild = div.firstElementChild
  document.body.appendChild(div)

  render(html`<div id="${id}"><span>Hello ${html`<span>planet</span>`}!</span></div>`, div)
  var res = document.getElementById(id)
  t.ok(res, 'element was mounted')
  t.ok(res.isSameNode(div), 'morphed onto existing node')
  t.ok(firstChild.isSameNode(res.firstElementChild), 'children morphed too')
  t.equal(res.innerText, 'Hello planet!', 'content match')
  document.body.removeChild(div)
  t.end()
})

test('updates in place', function (t) {
  var id = makeID()
  var div = document.createElement('div')
  div.innerHTML = '<span>Hi <strong>world</strong>!</span>'
  document.body.appendChild(div)

  render(main('planet'), div)
  var res = document.getElementById(id)
  t.equal(res.innerText, 'planet', 'content mounted')
  render(main('world'), div)
  t.equal(res.innerText, 'world', 'content updated')
  document.body.removeChild(div)
  t.end()

  function main (text) {
    return html`<div><span>Hello ${html`<span id="${id}">${text}</span>`}!</span></div>`
  }
})

test('persists in DOM between mounts', function (t) {
  var id = makeID()
  var div = document.createElement('div')
  div.innerHTML = '<span>Hi <span>world</span>!</span>'
  document.body.appendChild(div)

  render(foo('planet'), div)
  var res = document.getElementById(id)
  t.equal(res.innerText, 'planet', 'did mount')

  render(bar('world'), div)
  var updated = document.getElementById(id)
  t.ok(res.isSameNode(updated), 'same node')
  t.equal(updated.innerText, 'world', 'content updated')
  document.body.removeChild(div)
  t.end()

  function foo (text) {
    return html`<div><span>Hello ${name(text)}!</span></div>`
  }

  function bar (text) {
    return html`<div><span>Hello ${name(text)}!</span></div>`
  }

  function name (text) {
    return html`<span id="${id}">${text}</span>`
  }
})

test('updating with null', function (t) {
  var id = makeID()
  var div = document.createElement('div')
  div.innerHTML = '<span>Hi <strong>world</strong>!</span>'
  document.body.appendChild(div)

  render(main('planet'), div)
  var res = document.getElementById(id)
  t.equal(res.innerHTML, 'Hello planet!', 'did mount')
  render(main(false), div)
  t.equal(res.innerHTML, 'Hello !', 'node was removed')
  render(main('world'), div)
  t.equal(res.innerHTML, 'Hello world!', 'node added back')
  document.body.removeChild(div)
  t.end()

  function main (text) {
    return html`<div><span id="${id}">Hello ${text || null}!</span></div>`
  }
})

test('updating from null', function (t) {
  var id = makeID()
  var div = document.createElement('div')
  div.innerHTML = '<span>Hi <strong>world</strong>!</span>'
  document.body.appendChild(div)

  render(main(false), div)
  var res = document.getElementById(id)
  t.equal(res.innerHTML, 'Hello !', 'node was removed')
  render(main('planet'), div)
  t.equal(res.innerHTML, 'Hello planet!', 'did mount')
  render(main('world'), div)
  t.equal(res.innerHTML, 'Hello world!', 'node added back')
  document.body.removeChild(div)
  t.end()

  function main (text) {
    return html`<div><span id="${id}">Hello ${text || null}!</span></div>`
  }
})

test('updating with array', function (t) {
  var id = makeID()
  var div = document.createElement('div')
  div.innerHTML = 'Hi <span>world</span>!'
  document.body.appendChild(div)

  var children = [
    html`<span>planet</span>`,
    html`<span>world</span>`
  ]
  render(main(children[0]), div)
  var firstChild = div.firstElementChild
  t.equal(div.innerText, 'Hello planet!', 'child mounted')
  render(main(children), div)
  t.equal(div.innerText, 'Hello planetworld!', 'all children mounted')
  // t.equal(div.firstElementChild, firstChild, 'child remained in place')
  document.body.removeChild(div)
  t.end()

  function main (children) {
    return html`<div>Hello ${children}!</div>`
  }
})

test('alternating partials', function (t) {
  var id = makeID()
  var world = html`<span>world</span>`
  var planet = html`<span>planet</span>`
  var div = document.createElement('div')
  div.innerHTML = '<span>Hi <strong>world</strong>!</span>'
  document.body.appendChild(div)

  render(main(planet), div)
  var res = document.getElementById(id)
  t.equal(res.innerText, 'Hello planet!', 'did mount')
  render(main(world), div)
  t.equal(res.innerText, 'Hello world!', 'did update')
  document.body.removeChild(div)
  t.end()

  function main (child) {
    return html`<div><span id="${id}">Hello ${child}!</span></div>`
  }
})

test('reordering children', function (t) {
  var ids = [makeID(), makeID()]
  var children = [
    html`<span id="${ids[0]}">world</span>`,
    html`<span id="${ids[1]}">planet</span>`
  ]
  var div = document.createElement('div')
  div.innerHTML = '<span>Hi <strong>world</strong>!</span>'
  document.body.appendChild(div)

  render(main(children), div)
  var world = document.getElementById(ids[0])
  var planet = document.getElementById(ids[1])
  t.equal(world.nextSibling, planet, 'mounted in order')
  t.equal(div.innerText, 'Hello worldplanet!', 'children in order')
  render(main(children.reverse()), div)
  world = document.getElementById(ids[0])
  planet = document.getElementById(ids[1])
  t.equal(planet.nextElementSibling, world, 'children reordered')
  t.equal(div.innerText, 'Hello planetworld!', 'children in (reversed) order')
  document.body.removeChild(div)
  t.end()

  function main (children) {
    return html`<div><span>Hello ${children}!</span></div>`
  }
})

// test.only('component can render', function (t) {
//   var id = makeID()
//   var div = document.createElement('div')
//   div.innerHTML = '<span>Hi <strong>world</strong>!</span>'
//   document.body.appendChild(div)
//
//   var Greeting = Component(function Greeting (text) {
//     return html`<span>Hello <span id="${id}">${text}</span>!</span>`
//   })
//
//   render(main('planet'), div)
//   var res = document.getElementById(id)
//   console.log(div.outerHTML)
//   t.equal(res.innerText, 'planet', 'content mounted')
//   render(main('world'), div)
//   t.equal(res.innerText, 'world', 'content updated')
//   document.body.removeChild(div)
//   t.end()
//
//   function main (text) {
//     return html`<div>${Greeting(text)}</div>`
//   }
// })
//
// test.skip('component updates state', function (t) {
//   var id = makeID()
//   var div = document.createElement('div')
//   div.innerHTML = '<span>Hi <strong>world</strong>!</span>'
//   document.body.appendChild(div)
//
//   var update
//   var Greeting = Component(function Greeting (initialText) {
//     var [text, setText] = useState(initialText)
//     update = setText
//     return html`<span>Hello <span id="${id}">${text}</span>!</span>`
//   })
//
//   var context = new Context()
//   render(main('planet'), div, context)
//   var res = document.getElementById(id)
//   t.equal(res.innerText, 'planet', 'content mounted')
//   update('world')
//   t.equal(res.innerText, 'world', 'content updated')
//   document.body.removeChild(div)
//   t.end()
//
//   function main (text) {
//     return html`<div>${Greeting(text)}</div>`
//   }
// })

function makeID () {
  return 'uid-' + Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
}
