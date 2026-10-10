import type { Board3dMessages } from '../en/board3d';

export const board3dMessages: Board3dMessages = {
  board3d: {
    viewLabel: 'عرض اللوحة',
    view2d: '2D',
    view3d: '3D',
    label: 'لوحة ثلاثية الأبعاد من {{cols}} أعمدة و{{rows}} صفوف',
    labelPlay:
      'لوحة ثلاثية الأبعاد من {{cols}} أعمدة و{{rows}} صفوف. استخدم السهمين الأيسر والأيمن لاختيار عمود ومفتاح الإدخال لإسقاط قرص.',
    column: 'العمود {{n}}',
    noWebgl: 'يتطلب هذا العرض ثلاثي الأبعاد WebGL 2.',
  },
};
