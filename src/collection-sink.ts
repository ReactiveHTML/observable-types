import type { ExplicitSink, HTMLContainerElement, HTMLString, Sink, SinkBindingConfiguration } from 'rimmel';
import { Observable } from 'rxjs';
import type { UIOperation } from './types/ui-command';

import { ADD, ASSIGN, MOVE, NEXT, POP, PUSH, REPLACE, REVERSE, SET_FILTER, SHIFT, SORT, SPLICE, UNSHIFT, UPDATE } from './constants';
import { SINK_TAG } from 'rimmel';
import { Collection } from './collection';
import { ObservableItem } from './types/observable-item';
import { Count, Pos } from './types/array-meta';
import { FilterFunction } from './types/filter-function';

// const ItemTemplate = (item) => rml`<li><input value="${item.title}" onchange="${function() { item.title = this.value }}"> (${item.rnd})</li>`;
// const ItemTemplate = (item) => rml`<li><input value="${item.title}" onchange="${[item, 'title']}"> (${item.rnd}) <button onclick="${[item, undefined]}">X</button></li>`;
type ItemTemplate<I> = (item: I, index: number, _?: any ) => HTMLString;
// export const CollectionSink = <T extends HTMLContainerElement, CollectionType>(stream: CollectionType, template: ItemTemplate): Sink<T> => {
export const CollectionSink: ExplicitSink<'content'> =
	<I extends object>(stream: Collection<I>, template: ItemTemplate<ObservableItem<I>>, inputStream?: Observable<UIOperation<I>> ) => {
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
				//node.innerHTML = v.map(x => template(wrapxy<I>(x, stream.topic, stream))).join('');
				node.innerHTML = v.map(template).join('');
			}

			const updateChildFn = ([pos, key, str]: [number, string, HTMLString]) => node.children[pos].innerHTML = str;

			const replaceChildFn = ([pos, data]: [number, ObservableItem<I>]) => node.children[pos].outerHTML = template(data, pos);

			const shiftFn = () => node.firstElementChild?.remove();

			const popFn = () => node.lastElementChild?.remove();

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
					const content = (<ObservableItem<I>[]>newItems).map(template).join('') as HTMLString;
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
						appendFn(([] as ObservableItem<I>[]).concat(<ObservableItem<I>[]>args).map(template).join(''));
						break;

					case UNSHIFT:
						prependFn(([] as ObservableItem<I>[]).concat(<ObservableItem<I>[]>args).map(template).join(''));
						break;

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
						//updateChildFn([args[0], args[1], template(args[1])]);
						break;

					case MOVE:
						moveFn(...args);
						break;

					// case 'refresh':
					// case 'filter2 ?':
				};
			};

			inputStream?.subscribe?.(handler);
			return handler;
		};

		return <SinkBindingConfiguration<Element>>{
			type: SINK_TAG,
			t: 'Collection',
			source: stream,
			sink,
			// TODO: do we need to emit an initial value through a dedicated channel to render it synchronously?
			// initial: stream.map(i => template(wrapxy<I>(i, stream.topic, stream))).join(''),
		}
	};

