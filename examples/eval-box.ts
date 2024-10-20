import { filter, map, Subject } from 'rxjs';
import { rml, inputPipe, Value } from 'rimmel';

export const EvalBox = (data: ICollection<ItemType, string>) => {
  const FromInputBox = inputPipe(map((e: Event) => (<HTMLElement>e.target)!.parentElement!.querySelector('input')!.value));
  const OnEnter = inputPipe(filter((e: KeyboardEvent) => e.key == 'Enter'));

  const stream = new Subject<string>().pipe(
    map((x) => eval(`${x}`)),
    map((x) => `<pre class="eval-result">${JSON.stringify(x, null, 2)}</pre>`),
  );

  return rml`
    <fieldset class="eval-box">
      <legend>Eval Box</legend>
      <div>
        <input placeholder="data[0].title" onkeydown="${OnEnter(Value(stream))}">
        <button onclick="${FromInputBox(stream)}">Eval</button>
      </div>

      <div>${stream}</div>
    </fieldset>
  `;
}


