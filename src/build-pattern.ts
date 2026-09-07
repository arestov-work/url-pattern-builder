import type { ParsedUrl, BuildOptions } from './types'

function escapeLiteral(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
}

export function buildPattern(
	parsed: ParsedUrl,
	options: BuildOptions = {
		pathLength: 'exact',
		tailMode: 'ignore',
		tailParam: 'oid',
	},
): string {
	let core = '^'

	parsed.segments.forEach((seg) => {
		core += '/'
		switch (seg.mode) {
			case 'any':
				core += '[^/?]+'
				break
			case 'num':
				core += '\\d+'
				break
			case 'alt': {
				const values = [seg.value, ...seg.alts]
					.map((v) => v.trim())
					.filter(Boolean)
					.map(escapeLiteral)
				core += values.length
					? '(?:' + values.join('|') + ')'
					: escapeLiteral(seg.value)
				break
			}
			default:
				core += escapeLiteral(seg.value)
		}
	})

	const extra = options.pathLength === 'any' ? '(?:/[^/?]+)*' : ''
	core += extra

	if (options.tailMode === 'exact') {
		const name = escapeLiteral(options.tailParam)
		const val = parsed.tail ? escapeLiteral(parsed.tail.value) : ''
		return core + '/?\\?' + name + '=' + val + '$'
	}

	if (options.tailMode === 'exists') {
		const name = escapeLiteral(options.tailParam)
		return core + '/?\\?(?:[^#]*[?&])?' + name + '=\\d+'
	}

	return core + '/?(?:\\?.*)?$'
}
