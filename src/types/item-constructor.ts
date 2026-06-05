export type ItemConstructorType<R> =
    | ((r: R) => Record<string, R>)
    | (new (r: R) => Item<R>)
    | R
;