/**
 * Проверяет, что строка — корректное регулярное выражение
 * (конструктор RegExp не бросает ошибку).
 */
export function isValidPattern(pattern: string): boolean {
	try {
		new RegExp(pattern)
		return true
	} catch {
		return false
	}
}
