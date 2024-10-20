import type { ObservableItem } from './types/observable-item';
import { rml, Value, inputPipe, JSONDump } from 'rimmel';

import { Collection, ICollection } from './collection';
import { CollectionSink } from './collection-sink';
import { stringify } from 'querystring';
import { filter, map, Subject } from 'rxjs';

const DELETE = Symbol.for('delete');

interface ItemType {
  title: string;
  rnd: number;
};

const App = () => {
  const Item = (title: string): ItemType => ({ title, rnd: Math.round(Math.random() *1000) });
  const initialValues = [...Array(10)].map((x, i)=>`Initial Item ${i}`);
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
    return rml`
      <li>
        <input value="${item.observable.title}" onchange="${[item, 'title']}">
        (${item.rnd})
        <button onclick="${item[DELETE]}">X</button>
      </li>`
  };

  const EvalBox = (data: ICollection<ItemType, string>) => {
    const FromInputBox = inputPipe(map((e: Event) => (<HTMLElement>e.target)!.parentElement!.querySelector('input')!.value));
    const OnEnter = inputPipe(filter((e: KeyboardEvent) => e.key == 'Enter'));
    JSONDump;

    const stream = new Subject<string>().pipe(
      map((x) => eval(`${x}`)),
      map((x) => `result: ${x}`),
    );

    return rml`
      <div>
        <input placeholder="data[0].title" onkeydown="${OnEnter(Value(stream))}">
        <button onclick="${FromInputBox(stream)}">Eval</button>

        <div>${stream}</div>
      </div>
    `;
  }

  return rml`
    <h2>Observable Collection</h2>
    <p>A proxied Array that maps every mutation operation (push, pop, shift, unshift, splice, sort, reverse) to efficient DOM update operations</p>

    <controls>
      <button onclick="${() => data.pop()}">.pop()</button>
      <button onclick="${() => data.shift()}">.shift()</button>
      <div><button onclick="${append}">.push()</button> <input value="app" size="auto"></div>
      <div><button onclick="${prepend}">.unshift()</button> <input value="pre" size="auto"></div>

      <div><button onclick="${change}">change</button> <input value="3" size="2"> <input value="something else" size="auto"></div>

      <div><button onclick="${move}">.move() from, to, count</button> <input value="2" size="2"> <input value="4" size="2"> <input value="1" size="2"></div>
      <div><button onclick="${insertAt}">Insert at position </button> <input value="3" size="2" class="pos"> <input value="2" size="2" class="count"></div>
      <button onclick="${() => data.sort((a, b) => a.title < b.title ? -1 : 1)}">.sort</button>
      <button onclick="${() => data.reverse()}">.reverse</button>

      ${EvalBox(data)}
    </controls>

    <ol start="0">
      ${CollectionSink(data, ItemTemplate)}
    </ol>
  `;
};

document.body.innerHTML = App();
