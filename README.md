# ObservableTypes
This is a TypeScript/JavaScript library designed for managing structured data collections (e.g.: arrays of objects) with reactive bindings that the Observable/Observer interfaces (RxJS).


With these you can create reactive collections and manage operations on them in either an imperative, or functional style.

This library integrates seamlessly with Observable UI libraries such as [Rimmel.js](https://github.com/reactivehtml/rimmel) which have first-class support for the Observable/Observer interfaces.

## Features
ObservableTypes expose both the Observable and the Observer interfaces (like Rx.Subject), which makes them suitable for piping, streaming and merging with other reactive event streams.
It also enables you to create data collections where changes are defined as streams.

Additions? An observable stream.<br>
Item Removals? An observable stream.<br>
Moving items around? An observable stream.<br>

These are the key features:

- Wraps arrays into reactive data structures, allowing you to observe changes like additions, deletions, and modifications
- Built on top of RxJS to leverage its powerful reactive streams
- UI Binding: Supports binding data streams to UI elements, making it easier to build dynamic user interfaces with automatic updates
- Command Streams: Allows operations on collections to be issued through commands, which can be observed and reacted to or simply sinked to the DOM for efficient rendering

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
A `Collection` is a hybrid construct that implements the Array, Observable and Observer interfaces.

This allows standard array operations such as `push`, `pop`, `splice`, to also emit semantic notifications for rendering engines so they can use them to render changes in the most efficient way without the need to perform any diffing work. E.G.: `.push()` becomes an instruction like "add one to the bottom", etc.

Additional semantic operations are available, most notably `.move(from, to)`, to enable efficient drag'n'drop operations by only specifying which item needs to move where.


#### Example:
```typescript
import { Collection } from 'observable-types';

const Item = value => ({ value, created: Date.now() });
const myList = Collection([1, 2, 3], Item);


// A stream of 'unshift' operations
const prepends = data.pipe(
  filter(([cmd, data]) => cmd === 'unshift'),
  map(([cmd, data]) => data),
);

prepends.subscribe((e) => {
  console.log(`Added`, ...e, ' to the top');
});

// Modify the collection
myArray.unshift(Item(4));

// Logs: "Added {value: 'newItem', ... } to the top"
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

#### Example 1 (with Rimmel templates)
```typescript
import { Collection, CollectionSink } from 'observable-types';
import { rml, Value } from 'rimmel';

const Item = (title) => ({ title });
const ItemTemplate = item => `<li>${item.title}</li>`;
const list = Collection([], Item);
const listView = CollectionSink(list, ItemTemplate);

document.body.innerHTML = rml`
  <h1>List</h1>
  <ul>
    ${listView}
  </ul>

  <input placeholder="new stuff" onchange="${Value(items)}">Add</button>
`;
```
[Run on StackBlitz](https://stackblitz.com/edit/observable-types-no-framework)


It's not mandatory to use any UI library, though. In fact, you can also live without and imperatively sink an Observable Collection down the DOM by passing it a target node.
#### Example 2 (with no UI library):
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

### Playground
Check out the following [Kitchen Sink Application](https://stackblitz.com/edit/observable-types-kitchen-sink) where you can play and experiment with the whole feature set

## Contributing
Contributions are welcome! Please feel free to open issues or submit pull requests.


## Development Setup
Clone the repository.

Install dependencies:

```bash
# Copy code
npm install

# Run the tests:
npm test
```

## License
This project is licensed under the MIT License.
