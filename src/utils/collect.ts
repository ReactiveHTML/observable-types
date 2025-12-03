import type { Observable } from 'rxjs';
import type { ItemConstructorType } from '../types/item-constructor';

import { Collection } from '../collection';

/**
 * Create a collection from an observable source
 *
 * @param source The observable source to collect items from
 * @param constructor Optional constructor for the collection items
 * @returns A Collection populated with items from the source
 */
export const Collect = <T>(source: Observable<T>, constructor?: ItemConstructorType<T>) => {
	const collection = Collection<T>([], constructor);
	source.subscribe(collection.push);
	return collection;
};
