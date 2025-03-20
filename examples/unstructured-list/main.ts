import { Collection, HTMLList } from '../../src/index';
import { Subject, map } from 'rxjs';
import { Sortable } from './sortable';
import { rml, Value } from 'rimmel';

const data = Collection(['some', 'initial', 'values']);

const reset = new Subject().pipe(
  map(() => '')
);

document.body.innerHTML = rml`
  <h1>Sortable List</h1>
  <ul ...${Sortable({onOrderChange: data.move})}>
    ${HTMLList(data)}
  </ul>

  <input placeholder="add new stuff" onchange="${Value(data)}" onchange="${reset}" value="${reset}" autofocus>
`;

