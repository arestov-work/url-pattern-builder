import { buildPattern } from './build-pattern'
import type { ParsedUrl, BuildOptions } from './types'

/**
 * Проверяет, подходит ли ссылка под собранное правило.
 * Принимает состояние и опции, сам собирает regex и проверяет.
 */
export function matches(
	parsed: ParsedUrl,
	options: BuildOptions,
	url: string,
): boolean {
	const pattern = buildPattern(parsed, options)
	try {
		return new RegExp(pattern).test(url)
	} catch {
		return false
	}
}

/** Есть ли в разобранной ссылке хвост (параметр после «?»). */
export function hasTail(parsed: ParsedUrl): boolean {
	return parsed.tail !== null
}
