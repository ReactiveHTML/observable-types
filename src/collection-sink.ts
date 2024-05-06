import { Sink } from 'rimmel';
import type { HTMLContainerElement, HTMLString } from 'rimmel';

// const ItemTemplate = (item) => rml`<li><input value="${item.title}" onchange="${function() { item.title = this.value }}"> (${item.rnd})</li>`;
// const ItemTemplate = (item) => rml`<li><input value="${item.title}" onchange="${[item, 'title']}"> (${item.rnd}) <button onclick="${[item, undefined]}">X</button></li>`;
type ItemTemplate = (item: unknown) => HTMLString;

export const CollectionSink = <T extends HTMLContainerElement, CollectionType>(stream: CollectionType, template: ItemTemplate): Sink<T> => {

  const sink: Sink<T> = (node: HTMLElement) => {
    const appendFn = node.insertAdjacentHTML.bind(node, 'beforeend');
    const prependFn = node.insertAdjacentHTML.bind(node, 'afterbegin');
    const assignFn = (str: HTMLString) => node.innerHTML = str;
    // const updateChildFn = ([pos, key, str]: [number, string, HTMLString]) => node.children[pos].innerHTML = str;
    const updateChildFn = ([pos, data]: [number, unknown]) => node.children[pos].outerHTML = template(data);
    
    const shiftFn = () => node.firstChild?.remove();
    const popFn = () => node.lastChild?.remove();
    const removeChildren = (node: HTMLElement, pos: number, count: number) => {
      // TODO: performance, if we have many child elements,
      // detach the parent node from the DOM, remove children
      // then reattach the parent => reduce reflow/repaint
      for(var i=0;i<count;i++)
        node.removeChild(node.childNodes[pos]);
    };

    const insert = (node: HTMLElement, pos: number, html: HTMLString) => {
      if(node.childNodes.length && pos > 0) {
        (<HTMLElement>node.childNodes[pos]).insertAdjacentHTML('beforebegin', html);
      } else {
        prependFn(html);
      }
    };
    const spliceFn = (pos: number, deleteCount: number, ...str: HTMLString[]) => {
      if(deleteCount > 0) {
        removeChildren(node, pos, deleteCount);
      }
      if(str.length) {
        insert(node, pos, <HTMLString>str.join(''));
      }
    };

    const moveFn = (from: number, to: number, count: number = 1) => {
      // TODO: performance, if we have many child elements to move (count is very large),
      // detach the parent node from the DOM, remove children
      // then reattach the parent => reduce reflow/repaint
      if(count == 1) {
        node.insertBefore(node.childNodes[from], node.childNodes[to +1*(to > from)]);
      } else {
        for(var i=0, cut=[];i<count;i++) {
          cut.push(node.removeChild(node.childNodes[from]));
        }
        for(var i=0;i<count;i++) {
          node.insertBefore(cut[i], node.childNodes[to +i]);
        }
      }
    };

    return ([command, args]: [string, HTMLString] | [string, HTMLString[]] | [string, [HTMLString, number[]]]) => {
      switch(command) {
        case 'add':
        case 'push':
          [].concat(args).map(template).forEach(appendFn);
          break;
        case 'unshift':
          [].concat(args).map(template).forEach(prependFn);
          break;
        case 'splice':
          spliceFn(args[0], args[1], ...(args.length > 2 ? [].concat(args[2]).map(template) : []));
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
        case 'change':
          updateChildFn(args);
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
