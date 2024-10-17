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

#### Example 2 (with no UI library):
```typescript
import { Collection, CollectionSink } from 'observable-types';

const Item = (title) => ({ title });
const ItemTemplate = item => `<li>${item.title}</li>`;
const items = Collection([{ title: 'Task 1' }, { title: 'Task 2' }], Item);
const renderer = CollectionSink(items, ItemTemplate);

// Bind to a DOM element
list.subscribe(renderer.sink(document.querySelector('#my-list')));

// Make changes to see them rendered
items.push(Item('Task 3'));
items.assign(['New item 1', 'New item 2', 'New item 3'].map(Item));
items.move(1, 2);
items.pop();
items.shift();
```

### Playground
Check out the following [Kitchen Sink Application]() where you can play and experiment with the whole feature set

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
