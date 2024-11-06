import { Subject, map, withLatestFrom } from 'rxjs';

export const Sortable = ({ onOrderChange }) => {
	const dragStart = new Subject<HTMLLIElement>();
	const drop = new Subject<HTMLLIElement>();

	drop.pipe(
		withLatestFrom(dragStart),
		map(([dropEvt, dragEvt]) => {
			const list = [...dragEvt.target.closest('ul').children];
			return [ list.indexOf(dragEvt.target), list.indexOf(dropEvt.target.closest('li')) ]
		}),
	).subscribe(([src, dst])=>onOrderChange(src, dst));

	return {
		ondragstart: dragStart,
		ondragover: e=>e.preventDefault(),
		ondrop: drop,
	};
};

