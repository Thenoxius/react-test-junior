// Shared Tailwind classes, so the details view and the edit form line up
// exactly when switching between them.

const baseButton =
  'cursor-pointer rounded px-3 py-1.5 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2'

export const primaryButton = `${baseButton} bg-black text-white hover:bg-gray-800 pressed:bg-gray-700`

export const secondaryButton = `${baseButton} border border-black bg-white hover:bg-gray-100 pressed:bg-gray-200`

export const closeButton =
  'cursor-pointer rounded px-2 text-gray-600 outline-none hover:text-black focus-visible:ring-2 focus-visible:ring-black'

export const panelHeader = 'mb-4 flex items-start justify-between gap-4'

export const panelHeading = 'text-xl font-bold'

export const fieldGrid = 'mb-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2'

// Each row spans both columns of fieldGrid: label left, value right
export const fieldRow = 'col-span-2 grid grid-cols-subgrid items-center gap-y-1'

export const fieldLabel = 'font-semibold'

// A read-only value gets the same padding and (invisible) border as an
// input, so it takes up exactly the same space
export const fieldValue = 'border border-transparent px-2 py-1'

export const fieldInput =
  'rounded border border-gray-400 bg-white px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-black invalid:border-red-600'

export const fieldError = 'col-start-2 text-sm text-red-700'

export const panelActions = 'flex gap-2'
