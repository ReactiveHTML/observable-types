import type { ExplicitSink, HTMLContainerElement, HTMLString, Sink } from 'rimmel';
import type { UIOperation } from './types/ui-command';
import { wrapxy } from './wrapxy';

// const ItemTemplate = (item) => rml`<li><input value="${item.title}" onchange="${function() { item.title = this.value }}"> (${item.rnd})</li>`;
// const ItemTemplate = (item) => rml`<li><input value="${item.title}" onchange="${[item, 'title']}"> (${item.rnd}) <button onclick="${[item, undefined]}">X</button></li>`;
type ItemTemplate<I> = (item: I) => HTMLString;

// export const CollectionSink = <T extends HTMLContainerElement, CollectionType>(stream: CollectionType, template: ItemTemplate): Sink<T> => {
export const CollectionSink: ExplicitSink<'content'> = <I extends object>(stream: I, template: ItemTemplate<I>) => {
  const sink: Sink<HTMLContainerElement> = (node: HTMLContainerElement) => {
    // TODO: performance, if we have a very large number of elements to move/change,
    // detach the parent node from the DOM, remove children
    // then reattach the parent => reduce reflow/repaint
    // Rimmel currently doesn't support reattaching the parent node

	let filterFn: (item: I) => boolean;

    const appendFn = node.insertAdjacentHTML.bind(node, 'beforeend');

    const prependFn = node.insertAdjacentHTML.bind(node, 'afterbegin');

    const render = (items: I[]) => {
		let v = items;
		if(filterFn) {
			v = v.filter(filterFn);
		};
		//node.innerHTML = v.map(x => template(wrapxy<I>(x, stream.topic, stream))).join('');
		node.innerHTML = v.map(template).join('');
	}

    const updateChildFn = ([pos, key, str]: [number, string, HTMLString]) => node.children[pos].innerHTML = str;

    const replaceChildFn = ([pos, data]: [number, I]) => node.children[pos].outerHTML = template(data);

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

    const spliceFn = (pos: number, deleteCount: number, newItems: (undefined | ItemTemplate<I> | ItemTemplate<I>[])[]) => {
      removeChildren(node, pos, deleteCount);
      if(newItems?.length) {
        insert(node, pos, <HTMLString>newItems.map(i=>template(i)).join(''));
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

    return ([command, args]: UIOperation<I>) => {
      switch(command) {
        case 'add':
        case 'push':
          appendFn([].concat(args).map(i=>template(i)).join(''));
          break;
        case 'unshift':
          prependFn([].concat(args).map(i=>template(i)).join(''));
          break;
        case 'splice':
          spliceFn(...args);
          break;
        case 'pop':
          popFn();
          break;
        case 'shift':
          shiftFn();
          break;
        // case 'softFilter': // TODO
        // case 'hardFilter': // TODO
        case 'setFilter':
          filterFn = args;
          render(stream.toArray());
          break;
        case 'assign':
        case 'sort':
        case 'reverse':
          render(<I[]>args);
          break;
        case 'replace':
          replaceChildFn(args);
          break;
        case 'update':
          //updateChildFn([args[0], args[1], template(args[1])]);
          break;
        case 'move':
          moveFn(...args);
          break;
        // case 'refresh':
        // case 'filter2 ?':
      };
    };
  };

  const descriptor = {
    type: 'sink',
    source: stream,
    sink,
  }

  return descriptor;
};

