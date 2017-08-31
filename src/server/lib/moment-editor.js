/**
 * Editor class to manipulate a moment given a format string.
 *
 * @author J. Scott Smith
 * @license BSD-2-Clause-FreeBSD
 * @module lib/moment-editor
 */

const editors = {
  ad (ctx, num = 1, unit = 'd') {
    const n = num | 0

    return ctx.m.add(n, unit)
  },
  eo (ctx, unit = 'd') {
    return ctx.m.endOf(unit)
  },
  so (ctx, unit = 'd') {
    return ctx.m.startOf(unit)
  },
  su (ctx, num = 1, unit = 'd') {
    const n = num | 0

    return ctx.m.subtract(n, unit)
  }
}

// TODO: Move this class into its own NPM library
export default class Editor {
  constructor (format) {
    this.format = format

    const ctx = this.ctx = {} // Editor context
    const fns = this.fns = [] // Editor functions bound to the context and format args

    // Pre-process the format string
    format.split(',').forEach(spec => {
      const args = spec.split('_')
      const editor = editors[args[0]]

      if (editor) {
        fns.push(editor.bind(null, ctx, ...args.slice(1)))
      }
    })
  }

  /**
   * Apply edits to a moment.
   */
  edit (m) {
    this.ctx.m = m.clone()
    this.fns.forEach(fn => {
      this.ctx.m = fn()
    })

    return this.ctx.m
  }
}
