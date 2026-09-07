export { stripDomain } from './strip-domain'
export { parseUrl } from './parse-url'
export { buildPattern } from './build-pattern'
export { matches, hasTail } from './matches'
export { isValidPattern } from './is-valid-pattern'
export { createInitialState } from './create-initial-state'
export {
	setSegmentMode,
	setSegmentValue,
	addAlt,
	setAlt,
	removeAlt,
} from './segment-ops'

export { SEGMENT_MODES } from './types'
export type {
	Tail,
	Segment,
	ParsedUrl,
	SegmentMode,
	PathLength,
	TailMode,
	BuildOptions,
	ConstructorState,
} from './types'
