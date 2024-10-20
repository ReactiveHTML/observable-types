const add = new Subject<string>()
const remove = new Subject<pos>()
const dnds = new Subject<[from, to]>()

const dataStream = Collection(initial, Item, {
	push: add,
	splice.remove,
	dnds,
})

const dataStream = Collection(initial, Item, merge([additions, removals, dnds]))
const ItemTemplate = item => rml`<li>${item.name}</li>`

const template = rml`
	<button onclick="${add}">add</button>
	<button onclick="${remove}">remove</button>

	<ul ${Sortable()}>
		${CollectionSink(dataStream, ItemTemplate)}
	</ul>
`;

