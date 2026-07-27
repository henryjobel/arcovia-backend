import { randomUUID } from 'node:crypto';

/** Stable id for section/repeater-row subdocuments (drag-and-drop keys, dedupe on duplicate). */
export const genUid = () => randomUUID();
