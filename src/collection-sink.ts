import type { ICollection } from './types/icollection';
import type { UIOperation } from './types/ui-command';
import type { Count, Pos } from './types/array-meta';
import type { FilterFunction } from './types/filter-function';
import type { ObservableItem } from './types/observable-item';
import type { ExplicitSink, HTMLContainerElement, HTMLString, Sink, SinkBindingConfiguration } from 'rimmel';
import type { Observable } from 'rxjs';

import { ADD, ASSIGN, MOVE, NEXT, POP, PUSH, REPLACE, REVERSE, SET_FILTER, SHIFT, SORT, SPLICE, UNSHIFT, UPDATE } from './constants';
import { SINK_TAG } from 'rimmel';

type ItemTemplate<I> = (item: ObservableItem<I> | HTMLString, pos: number, array: (ObservableItem<I> | HTMLString)[]) => HTMLString;

export const CollectionSink: ExplicitSink<'content'> =
	<I extends object>
	(stream: ICollection<I, any>, template?: ItemTemplate<I>, inputStream?: Observable<UIOperation<I>> ) => {

		const maybeTemplate = template
			? (data: ObservableItem<I>, pos: number, array: ObservableItem<I>[]): HTMLString => template(data, pos, array)
			: (data: HTMLString, pos: number, array: HTMLString[]): HTMLString => data
		;

		const sink: Sink<HTMLContainerElement> = (node: HTMLContainerElement) => {
			// TODO: performance, if we have a very large number of elements to move/change,
			// detach the parent node from the DOM, remove children
			// then reattach the parent => reduce reflow/repaint

			let sortFn: (a: I, b: I) => number;
			let filterFn: FilterFunction<I>;

			const appendFn = node.insertAdjacentHTML.bind(node, 'beforeend');

			const prependFn = node.insertAdjacentHTML.bind(node, 'afterbegin');

			const render = (items: ObservableItem<I>[]) => {
				let v = items;
				if(filterFn) {
					v = v.filter(filterFn);
				};
				node.innerHTML = v.map(maybeTemplate).join('');
			}

			const updateChildFn = ([pos, key, str]: [number, string, HTMLString]) =>
				node.children[pos].innerHTML = str;

			const replaceChildFn = ([pos, data]: [number, ObservableItem<I>]) =>
				node.children[pos].outerHTML = maybeTemplate(data, pos, stream);

			const shiftFn = () =>
				node.firstElementChild?.remove();

			const popFn = () =>
				node.lastElementChild?.remove();

			const removeChildren = (node: HTMLElement, pos: number, count: number) => {
				for(var i=0;i<count;i++)
					node.removeChild(node.children[pos]);
			};

			const insert = (node: HTMLElement, pos: number, html: HTMLString) => {
				if(node.childNodes.length && pos > 0) {
					(<HTMLElement>node.children[pos]).insertAdjacentHTML('beforebegin', html);
				} else {
					prependFn(html);
				}
			};

			const spliceFn = (pos: number, deleteCount: number, newItems?: (ObservableItem<I> | ObservableItem<I>[])) => {
				removeChildren(node, pos, deleteCount);
				if((<ObservableItem<I>[]>newItems)?.length) {
					const content = (<ObservableItem<I>[]>newItems).map(maybeTemplate).join('') as HTMLString;
					if(pos < node.children.length) {
						insert(node, pos, content);
					} else {
						appendFn(content);
					}
				}
			};

			const moveFn = (from: number, to: number, count: number = 1) => {
				if(count == 1) {
					node.insertBefore(node.children[from], node.children[to +1*Number(to > from)]);
				} else {
					for(var i=0, cut=<Element[]>[];i<count;i++) {
						cut.push(node.removeChild(node.children[from]));
					}
					for(var i=0;i<count;i++) {
						node.insertBefore(cut[i], node.children[to +i]);
					}
				}
			};

			const handler = ([command, args]: UIOperation<I>) => {
				switch(command) {
					case ASSIGN:
					case SORT:
					case REVERSE:
						render(args as ObservableItem<I>[]);
						break;

					case ADD:
					case PUSH:
					case NEXT:
						appendFn(([] as ObservableItem<I>[]).concat(<ObservableItem<I>[]>args).map(maybeTemplate).join(''));
						break;

					case UNSHIFT:
						prependFn(([] as ObservableItem<I>[]).concat(<ObservableItem<I>[]>args).map(maybeTemplate).join(''));
						break;

					// case COPY_WITHIN:
					// case FILL:
					// TODO: ...

					case SPLICE:
						spliceFn(...args as [Pos, Count, (ObservableItem<I> | ObservableItem<I>[])?]);
						break;

					case POP:
						popFn();
						break;

					case SHIFT:
						shiftFn();
						break;

					// case 'softFilter': // TODO
					// case 'hardFilter': // TODO

					case SET_FILTER:
						filterFn = <FilterFunction<I>>args;
						render(stream.toWrappedArray());
						break;

					case REPLACE:
						replaceChildFn(<[Pos, ObservableItem<I>]>args);
						break;

					case UPDATE:
						//updateChildFn([args[0], args[1], maybeTemplate(args[1])]);
						break;

					case MOVE:
						moveFn(...args);
						break;

					// case 'refresh':
				};
			};

			inputStream?.subscribe?.(handler);
			return handler;
		};

		return <SinkBindingConfiguration<HTMLContainerElement>>{
			type: SINK_TAG,
			t: 'Collection',
			source: stream,
			sink,
			// TODO: do we need to emit an initial value through a dedicated channel to render it synchronously?
			//value: stream._data.map(maybeTemplate).join('')
		}
	};

