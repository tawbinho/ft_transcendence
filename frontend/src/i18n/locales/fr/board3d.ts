import type { Board3dMessages } from '../en/board3d';

export const board3dMessages: Board3dMessages = {
  board3d: {
    viewLabel: 'Vue du plateau',
    view2d: '2D',
    view3d: '3D',
    label: 'Plateau en 3D de {{cols}} colonnes et {{rows}} rangées',
    labelPlay:
      'Plateau en 3D de {{cols}} colonnes et {{rows}} rangées. Utilisez les flèches gauche et droite pour choisir une colonne et Entrée pour lâcher un jeton.',
    column: 'Colonne {{n}}',
    noWebgl: 'Cette vue 3D nécessite WebGL 2.',
  },
};
