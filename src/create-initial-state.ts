import { parseUrl } from './parse-url'
import type { ConstructorState } from './types'

/**
 * Из ссылки собирает начальное состояние конструктора:
 * разбирает путь, определяет хвост и режим по умолчанию.
 */
export function createInitialState(url: string): ConstructorState {
	const parsed = parseUrl(url)
	return {
		segments: parsed.segments,
		tail: parsed.tail,
		tailMode: parsed.tail ? 'exists' : 'ignore',
		tailParam: parsed.tail?.name || 'oid',
	}
}
