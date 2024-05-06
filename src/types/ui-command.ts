import { ArrayMethod } from './array-meta';
import { DestPos, Count, DeleteCount, StartPos, Pos } from './array-meta';

/**
 * An array representation of UI data manipulation request
 */
export type UIOperation<I> =
	[ArrayMethod] |
	// ['sink', ??? ] |
	// ['subscribe', ??? ] |

	['sort', I[]] |
	['reverse', I[]] |

	['assign', I | I[]] |

	['replace', [StartPos, I]] |
	['update', [Pos, I]] |

	['push', I | I[]] |
	['unshift', I | I[]] |
	['move', [StartPos, DestPos, Count?]] |
	['splice', [StartPos, DeleteCount, (I | I[])?]];

/**
 * An array representation of a data manipulation request
 */
export type DataOperation<I> =
	['pop'] |
	['shift'] |
	['sort', ((a: I, b: I) => number)] |
	['reverse'] |

	['assign', I | I[]] |
	['replace', [StartPos, I]] |
	['update', [Pos, string, any]] |
	['add', I | I[]] |
	['push', I | I[]] |
	['unshift', I | I[]] |
	['move', [StartPos, DestPos, Count?]] |
	['splice', [StartPos, DeleteCount, (I | I[])?]]
;
