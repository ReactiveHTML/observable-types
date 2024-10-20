import type { ObservableItem } from '../src//types/observable-item';
import { html, rml, Value, PrependHTML } from 'rimmel';

import { Collection, ICollection } from '../src/collection';
import { CollectionSink } from '../src/collection-sink';
import { scan } from 'rxjs';

import { EvalBox } from './eval-box';

const DELETE = Symbol.for('delete');

interface ItemType {
  title: string;
  rnd: number;
  [Symbol.toStringTag]?: any;
};

const App = () => {
  const Item = (title: string): ItemType => ({
  	title,
	rnd: Math.round(Math.random() *1000),
	get [Symbol.toStringTag]() { return `"${this.title}"` },
  });
  const initialValues = [...Array(10)].map((x, i)=>`Item ${i}`);
  const data = Collection<string, ItemType>(initialValues, Item);

  const append = (e: Event) => {
    const content = (e.target as HTMLElement).parentElement!.querySelector('input')!.value;
    data.push(content)
  }

  const prepend = (e: Event) => {
    const content = (e.target as HTMLElement).parentElement!.querySelector('input')!.value;
    data.unshift(content)
  }

  const insertAt = (e: Event) => {
    const pos = parseInt(((<HTMLElement>e.target)!.parentElement!.querySelector('input.pos') as HTMLInputElement)!.value, 10);
    const count = parseInt(((<HTMLElement>e.target)!.parentElement!.querySelector('input.count') as HTMLInputElement)!.value, 10);
    data.splice(pos, 0, ...[...Array(count)].map((_, i)=>`inserted @${pos +i}`));
  };

  const move = (e: Event) => {
    const inputs = [...(<HTMLElement>e.target).parentElement!.querySelectorAll('input')];
    const from = parseInt(inputs[0].value, 10);
    const to = parseInt(inputs[1].value, 10);
    const count = parseInt(inputs[2].value, 10);
    data.move(from, to, count);
  };

  const change = (e: Event) => {
    const inputs = [...(<HTMLElement>e.target).parentElement!.querySelectorAll('input')];
    const item = parseInt(inputs[0].value, 10);
    const newValue = inputs[1].value;

    data[item].title = newValue;
  }

  const ItemTemplate = (item: ObservableItem<ItemType>) => {
    // const t2 = item.observe('title');
    // console.log('PRINT', item);
    return html`
      <li>
        <input class="value-box" value="${item.observable.title}" onchange="${[item, 'title']}">
        (${item.rnd})
        <button onclick="${item[DELETE]}">X</button>
      </li>`
  };

  const commandStream = data.pipe(
    scan((a, b) => `<pre>${b}</pre>`, '')
  );

  data.subscribe(x=>console.log(x));

  return html`
    <h2>Observable Collection</h2>
    <p>A proxied Array that maps every mutation operation (push, pop, shift, unshift, splice, sort, reverse) to efficient DOM update operations using the Observable/Observer interfaces</p>

    <div class="col-layout">
      <controls>
        <button onclick="${data.pop}">.pop()</button><br>

        <button onclick="${data.shift}">.shift()</button>

        <div><button onclick="${append}">.push()</button> <input value="app" size="auto"></div>

        <div><button onclick="${prepend}">.unshift()</button> <input value="pre" size="auto"></div>

        <div><button onclick="${change}">change</button> <input value="3" size="2"> <input value="something else" size="auto"></div>

        <div><button onclick="${move}">.move()</button>
          <label>FROM<input type="number" value="2"></label>
          <label>TO<input type="number" value="4"></label>
          <label>CNT<input type="number" value="1"></label>
        </div>

        <div>
          <button onclick="${insertAt}">Insert at</button>
          <label>POS: <input type="number" value="3" size="2" class="pos"></label>
          <label>items: <input type="number" value="2" size="2" class="count"></label>
        </div>

        <button onclick="${() => data.sort((a, b) => a.title < b.title ? -1 : 1)}">.sort</button>

        <button onclick="${() => data.reverse()}">.reverse</button>

        ${EvalBox(data)}

        <hr>
        Observable Collection from <a href="https://github.com/ReactiveHTML/observable-types">ObservableTypes</a><br>
        Observable templating powered by <a href="https://github.com/ReactiveHTML/rimmel">Rimmel.js</a>
      </controls>

      <ol start="0">
        ${CollectionSink(data, ItemTemplate)}
      </ol>
    </div>

    <div class="command-stream">
      <h3 class="lbl">Action History:</h3>
      <div>${PrependHTML(commandStream)}</div>
    </div>
  `;
};

document.body.innerHTML = App();


