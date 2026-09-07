export function stripDomain(raw: string): string {
	const withoutSpaces = raw.trim()
	const noScheme = withoutSpaces.replace(/^[a-zA-Z][\w+.\-]*:\/\//, '')

	if (noScheme.startsWith('/')) return noScheme

	const slash = noScheme.indexOf('/')
	const host = slash === -1 ? noScheme : noScheme.slice(0, slash)

	const looksHost = /[.:]/.test(host) || noScheme !== withoutSpaces

	if (looksHost) {
		return slash === -1 ? '/' : noScheme.slice(slash)
	}

	return raw
}
