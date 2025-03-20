import type { ArrayMethod, DestPos, Count, DeleteCount, StartPos, Pos } from './array-meta';
import type { FilterFunction } from './filter-function';
import type { ObservableItem } from './observable-item';

type Key = string;
type Value = any;

/**
 * An array *representation* of UI data manipulation request.
 * @remarks this is not the format used by array operations, just a representation of the operation for rendering purposes
 */
export type UIOperation<I> =
	| [ArrayMethod]

	| readonly ['sort', I[]]
	| readonly ['reverse', I[]]

	| readonly ['assign', (I | ObservableItem<I>)[]]

	| readonly ['delete', Pos | Pos[]]
	| readonly ['deleteProperty', [I, Key]]
	| readonly ['replace', [Pos, I]]
	| readonly ['update', [Pos, Key, Value]] // if descendant elements update themselves, this is not needed, right?

	| readonly ['setFilter' | 'softFilter' | 'hardFilter', FilterFunction<I>]
	| readonly ['add' | 'push' | 'next', I[]]
	| readonly ['unshift', I[]]
	| readonly ['move', [StartPos, DestPos, Count?]]
	| readonly ['splice', [StartPos, DeleteCount, (I | ObservableItem<I>)[]?]]
;
