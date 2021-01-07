'use strict'

const mathCore = require('../index')

const repl = require('repl').start()

Object.assign(repl.context, mathCore)

Object.defineProperty(repl.context, 'exit', {
  enumerable: true,
  get: () => process.exit(0)
})

Object.defineProperty(repl.context, 'quit', {
  enumerable: true,
  get: () => repl.context.exit
})
