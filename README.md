![ObservableTypes](./observable-types.png)

# Observable Types
Reactive, Rendering-aware JavaScript primitives for data collections (e.g.: Arrays of strings or Arrays of Objects) in the DOM and manage all sorts of updates in an efficient manner without using a Virtual DOM and zero boilerplate.

With these you can create reactive collections and manage operations on them in either an imperative or streams-oriented style.

Reactive bindings are exposed through the Observable and Observer interfaces (e.g.: RxJS) and integrates seamlessly with streams-oriented UI libraries such as [Rimmel.js](https://github.com/reactivehtml/rimmel).

## Features
ObservableTypes expose both the Observable and the Observer interfaces (like the Rx.Subject), which makes them suitable for piping, streaming and merging with other reactive event streams.

It also enables you to create data collections where changes are described as event streams.

You can also subscribe to any event stream to feed your collections.

## Installation
Install via npm:

```bash
npm install observable-types
```

Then import it into your project:

```typescript
import { Collection, CollectionSink } from 'observable-types';
```

## Key Concepts

### Collection
A `Collection` is a hybrid construct that implements the `Array`, the `Observable` and `Observer` interfaces. 
It behaves just like an Array, with all its standard methods such as `push`, `pop`, `splice`, etc.

These will emit semantic notifications for rendering so they can use them to make changes in a UI in efficient ways without the need to perform any complicated or anyways heavy diffing work. E.G.: `.push()` becomes an instruction like "append an item to the bottom of the view".

Additional semantic operations are also available, most notably `.move(from, to)`, to enable efficient drag'n'drop operations by only specifying which item needs to move and where.

#### Basic Example:
```typescript
import { Collection } from 'observable-types';

// Construct an Item from a value
const Item = (value: string | number) =>
  ({ value, created: Date.now() });

// Create a simple Collection and pass the
// Item constructor for type integrity
const myList = Collection([1, 2, 3], Item);


// Create a stream of "unshift" operations.
// `data` is Observable, so it can be
// piped and subscribed to.
const insertions = data.observe('unshift');

// Do something when items are inserted
insertions.subscribe((e) => {
  console.log(`Added`, ...e, ' to the top');
});


// Finally, modify the collection
myArray.unshift('new stuff');
// Logs: "Added {value: 'new stuff', ... } to the top"

myArray.push('other stuff');
// Logs nothing, as we're only listening for
// 'unshift' events
```

### Collection API
- assign(newItems: T[]): Replaces the entire array with a new array of items.
- move(src: number, dst: number, count: number): Moves a set of items from one index to another within the collection.
- observe(prop: string): Returns an Observable that emits changes for the specified operation (e.g., 'push', 'splice').
- toArray(): Returns the underlying array as a standard array.
- push(...items: T[]): Adds new items to the end of the collection and emits a reactive update.

### CollectionSink
`CollectionSink` is an adapter used to render a `Collection` into an HTML container and make efficient updates based on the semantic notifications emitted by the `Collection`.

Since the `Collection` notifications are semantic, they give enough information to render changes in the most efficient way without having to perform any diffing.

All you need is the collection and a template to use for rendering new items.

Observable Types best shine when used with an Observable-aware UI library such as [Rimmel](https://github.com/reactivehtml/rimmel), in which connecting an observable stream to the DOM is as trivial as putting it in the template:

## A Basic Example (with Rimmel.js)
```typescript
import { Collection, HTMLList } from 'observable-types';
import { rml, Cut } from 'rimmel';

const items = Collection(['foo', 'bar', 'baz']);

document.body.innerHTML = rml`
  <h1>List</h1>
  <ul>
    ${HTMLList(items)}
  </ul>

  Add new stuff: <input onchange="${Cut(items)}">
`;
```
[Run on StackBlitz](https://stackblitz.com/edit/observable-types-basics)

In addition to the above, when you need to customise various aspects of your collection or the rendering, you can use item constructors and templates for your items as in the following example:

## Customisations (with Rimmel.js)
Item Constructors can be used to conveniently construct valid Items from primitive values (like a string or a number) and be used automatically in the collection whenever a new item is added.

Custom views can also be used to render each item exactly as required.

```typescript
import { Collection, CollectionSink } from 'observable-types';
import { rml, Cut } from 'rimmel';

// A factory function for items
const Item = (title) => ({ title });

// The template used to render each
const ItemTemplate = item => `<li>${item.title}</li>`;

// The actual collection
const list = Collection([], Item);

// A view connected to the list.
// There can be multiple views on the same page
const listView = CollectionSink(list, ItemTemplate);

document.body.innerHTML = rml`
  <h1>List</h1>
  <ul>
    ${listView}
  </ul>

  Add new stuff: <input onchange="${Cut(items)}">
`;
```

## Reactive views
Item templates can enjoy the full reactive power of Rimmel.js and update the view whenever the underlying object changes.

```typescript
import { Collection, CollectionSink } from 'observable-types';
import { rml, Cut } from 'rimmel';

const Item = (title) => ({ title });

const ItemTemplate = item => rml`
  <li><input value="${item.observable.title}" onchange="${item.observable.title}"></li>
`;

const list = Collection([], Item);

document.body.innerHTML = rml`
  <h1>List</h1>
  <ul>
    ${CollectionSink(list, ItemTemplate)}
  </ul>

  Add new stuff: <input onchange="${Cut(list)}">
`;
```

## Convenience
Every method of a Collection can be used directly in your event handlers to dictate the exact behaviour in a point-free style:

```typescript
import { Collection, HTMLList } from 'observable-types';
import { rml, Cut } from 'rimmel';

const items = Collection(['foo', 'bar', 'baz']);

document.body.innerHTML = rml`
  <h1>List</h1>
  <ul>
    ${HTMLList(items)}
  </ul>

  Prepend new stuff: <input onchange="${Cut(items.unshift)}">
  Append new stuff: <input onchange="${Cut(items.push)}">
  <button onclick="${items.shift}">Remove first</button>
  <button onclick="${items.pop}">Remove last</button>
`;
```

## Vanilla JS
It's not mandatory to use any UI library, though. In fact, you can also live without and imperatively sink an Observable Collection down the DOM by passing it a target node.

```typescript
import type { ObservableItem } from 'observable-types';
import { Collection, CollectionSink } from 'observable-types';

interface I {
	title: string;
	timestamp: number;
}

const Item = (title: string): I => ({ title, timestamp: Date.now() });
const ItemTemplate = (item: ObservableItem<I>) => `<li>${item.title}</li>`;
const items = Collection(['Item 1', 'Item 2'].map(i=>Item(i)), Item);
const renderer = CollectionSink(items, ItemTemplate);

// Bind to a DOM element
items.subscribe(renderer.sink(document.querySelector('#app')));

// Make changes to see them rendered
setTimeout(() => items.push(Item('Item 3')), 1000);
setTimeout(() => items.move(0, 1), 2000);
setTimeout(() => items.pop(), 3000);
setTimeout(() => items.shift(), 4000);
```

[Run on StackBlitz](https://stackblitz.com/edit/observable-types-no-framework)

## Playground
Check out the following [Kitchen Sink Application](https://stackblitz.com/edit/observable-types-kitchen-sink) where you can play and experiment with the whole feature set

## Contributing
Contributions are welcome! Please feel free to open issues or submit pull requests.

## Development Setup
```bash
npm install
vite
```

## License
This project is licensed under the MIT License.
