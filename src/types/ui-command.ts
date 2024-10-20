import type { ArrayMethod, DestPos, Count, DeleteCount, StartPos, Pos } from './array-meta';
import type { FilterFunction } from './filter-function';

type Key = string;
type Value = any;

/**
 * An array representation of UI data manipulation request
 */
export type UIOperation<I> =
	| [ArrayMethod]

	| ['sort', I[]]
	| ['reverse', I[]]

	| ['assign', I | I[]]

	| ['delete', Pos | Pos[]]
	| ['deleteProperty', [I, Key]]
	| ['replace', [Pos, I]]
	| ['update', [Pos, Key, Value]] // if descendant elements update themselves, this is not needed, right?

	| ['setFilter' | 'softFilter' | 'hardFilter', FilterFunction<I>]
	| ['add' | 'push' | 'next', I | I[]]
	| ['unshift', I | I[]]
	| ['move', [StartPos, DestPos, Count?]]
	| ['splice', [StartPos, DeleteCount, (I | I[])?]]
;
