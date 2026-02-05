import { CollectionSink } from '../collection-sink';

const Template = item => `<li draggable="true">${item}</li>`;

export const HTMLList = (...data) => CollectionSink(...data, Template);

