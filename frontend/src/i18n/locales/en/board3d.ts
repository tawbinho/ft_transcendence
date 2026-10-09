export const board3dMessages = {
  board3d: {
    viewLabel: 'Board view',
    view2d: '2D',
    view3d: '3D',
    label: 'Board in 3D with {{cols}} columns and {{rows}} rows',
    labelPlay:
      'Board in 3D with {{cols}} columns and {{rows}} rows. Use the left and right arrow keys to choose a column and Enter to drop a disc.',
    column: 'Column {{n}}',
    noWebgl: 'This 3D view needs WebGL 2.',
  },
};

export type Board3dMessages = typeof board3dMessages;
