let idCounter = 0;
const idPrefix = 'story-';
export function generateUniqueId(): string {
  return `${idPrefix}${++idCounter}`;
}