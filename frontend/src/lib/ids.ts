// Unique IDs for new rows and comparisons anywhere in the app.
// Starts high so it never collides with the hard-coded starting rows (1, 2).
let nextId = 1000

export function newRowId(): number {
  return nextId++
}