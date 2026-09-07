import type { ParsedUrl, Segment, Tail } from './types'

export function parseUrl(raw: string): ParsedUrl {
	let path = raw.trim()
	let query = ''
	let hasTrailingSlash = false

	const questionMark = path.indexOf('?')
	if (questionMark !== -1) {
		query = path.slice(questionMark + 1)
		path = path.slice(0, questionMark)
	}

	if (path.length > 1 && path.endsWith('/')) {
		hasTrailingSlash = true
		path = path.slice(0, -1)
	}

	const parts = path.split('/').filter((part) => part.length > 0)
	const segments: Segment[] = parts.map((part) => ({
		value: part,
		mode: 'exact',
		alts: [],
	}))

	let tail: Tail | null = null

	if (query) {
		const first = query.split('&')[0]
		const eq = first.indexOf('=')
		if (eq !== -1) {
			tail = { name: first.slice(0, eq), value: first.slice(eq + 1) }
		} else {
			tail = { name: first, value: '' }
		}
	}

	return {
		segments,
		hasTrailingSlash,
		tail,
	}
}
