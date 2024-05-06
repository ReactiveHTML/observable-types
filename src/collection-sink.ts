import { Sink } from 'rimmel';
import type { HTMLContainerElement, HTMLString } from 'rimmel';
import { DataOperation } from './types/ui-command';

// const ItemTemplate = (item) => rml`<li><input value="${item.title}" onchange="${function() { item.title = this.value }}"> (${item.rnd})</li>`;
// const ItemTemplate = (item) => rml`<li><input value="${item.title}" onchange="${[item, 'title']}"> (${item.rnd}) <button onclick="${[item, undefined]}">X</button></li>`;
type ItemTemplate = (item: unknown) => HTMLString;

export const CollectionSink = <T extends HTMLContainerElement, CollectionType>(stream: CollectionType, template: ItemTemplate): Sink<T> => {

  const sink: Sink<T> = (node: HTMLElement) => {
    // TODO: performance, if we have a very large number of elements to move/change,
    // detach the parent node from the DOM, remove children
    // then reattach the parent => reduce reflow/repaint
    // Rimmel currently doesn't support reattaching the parent node

    const appendFn = node.insertAdjacentHTML.bind(node, 'beforeend');

    const prependFn = node.insertAdjacentHTML.bind(node, 'afterbegin');

    const assignFn = (str: HTMLString) => node.innerHTML = str;

    // const updateChildFn = ([pos, key, str]: [number, string, HTMLString]) => node.children[pos].innerHTML = str;

    const replaceChildFn = ([pos, data]: [number, unknown]) => node.children[pos].outerHTML = template(data);

    const shiftFn = () => node.firstChild?.remove();

    const popFn = () => node.lastChild?.remove();

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

    const spliceFn = (pos: number, deleteCount: number, ...newItems: (undefined | ItemTemplate | ItemTemplate[])[]) => {

      // if(deleteCount > 0) {
      removeChildren(node, pos, deleteCount);
      if(newItems?.length) {
        insert(node, pos, <HTMLString>newItems.map(template).join(''));
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

    return ([command, args]: DataOperation<I>) => {
      switch(command) {
        case 'add':
        case 'push':
          appendFn([].concat(args).map(template).join(''));
          break;
        case 'unshift':
          prependFn([].concat(args).map(template).join(''));
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
        case 'assign':
        case 'sort':
        case 'reverse':
            assignFn(args.map(template).join(''));
          break;
        case 'replace':
          replaceChildFn(args);
          break;
        case 'update':
          // updateChildFn(args);
          break;
        case 'move':
          moveFn(...args);
          break;
        // case 'refresh':
        // case 'filter2 ?':
      };
    };
  };

  sink.sink = 'collection';
  sink.stream = stream;

  return sink;
};
