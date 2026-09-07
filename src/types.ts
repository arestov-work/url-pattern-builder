export interface Tail {
	name: string
	value: string
}

export const SEGMENT_MODES = [
	{ id: 'exact', label: 'точное совпадение' },
	{ id: 'any', label: 'любые символы' },
	{ id: 'num', label: 'только числа' },
	{ id: 'alt', label: 'или' },
] as const

export type SegmentMode = (typeof SEGMENT_MODES)[number]['id']

export interface Segment {
	value: string
	mode: SegmentMode
	alts: string[]
}

export interface ParsedUrl {
	segments: Segment[]
	hasTrailingSlash: boolean
	tail: Tail | null
}

export type PathLength = 'exact' | 'any'

export type TailMode = 'ignore' | 'exists' | 'exact'

export interface BuildOptions {
	pathLength: PathLength
	tailMode: TailMode
	tailParam: string
}

export interface ConstructorState {
	segments: Segment[]
	tail: Tail | null
	tailMode: TailMode
	tailParam: string
}
