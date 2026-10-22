import type { HomeMessages } from '../en/home';

export const homeMessages: HomeMessages = {
  home: {
    title: 'أربعة في صف. طرق لعب لا تنتهي.',
    subtitle:
      'أسقط أقراصك، وصِل أربعة منها قبل خصمك، واختر تحديك: صديق على الشاشة نفسها، أو الحاسوب، أو لاعب عبر الإنترنت.',
    playNow: 'العب الآن',
    createAccount: 'أنشئ حسابًا',
    modesTitle: 'طرق اللعب',
    local: { title: 'على الشاشة نفسها', body: 'لاعبان يتناوبان على جهاز واحد. لا حاجة إلى حساب.' },
    computer: { title: 'ضد الحاسوب', body: 'ثلاثة مستويات، من الهادئ إلى الذي لا يرحم. أنشئ حسابًا لتلعب.' },
    online: { title: 'عبر الإنترنت', body: 'أنشئ مباراة، وأرسل الرابط، والعب مع صديق أينما كان.' },
    customTitle: 'لوحتك، قواعدك',
    customBody: 'اختر من 5 إلى 10 أعمدة ومن 5 إلى 9 صفوف، وصِل 3 أو 4 أو 5 أقراص، واختر ألوانك.',
    onlineGuestTitle: 'أنشئ حسابًا للعب عبر الإنترنت',
    points: {
      title: 'وهناك المزيد',
      tournaments: {
        title: 'البطولات',
        body: 'أنشئ بطولة بنظام خروج المغلوب عبر الإنترنت، أو انضم إلى واحدة.',
      },
      community: {
        title: 'الأصدقاء والرسائل',
        body: 'أضف أصدقاء وتحدّث معهم وتحدَّهم في مباراة.',
      },
    },
    greeting: {
      morning: 'صباح الخير، {{name}}',
      afternoon: 'مساء الخير، {{name}}',
      evening: 'مساء الخير، {{name}}',
    },
    dashboardSubtitle: 'أكمل من حيث توقفت.',
    quick: {
      title: 'ابدأ لعبة',
      online: 'مباراة جديدة عبر الإنترنت',
      computer: 'ضد الحاسوب',
      local: 'على الشاشة نفسها',
      tournaments: 'البطولات',
    },
    yourTurn: {
      title: 'دورك',
      all: 'كل المباريات',
      empty: 'لا توجد مباراة تنتظر حركتك.',
      others: 'مباريات جارية: {{count}}.',
      versus: 'ضد {{name}}',
      move: 'دورك',
    },
    recent: { title: 'النتائج الأخيرة', all: 'كل المباريات', empty: 'ستظهر مبارياتك المنتهية هنا.' },
    friendsOnline: {
      title: 'الأصدقاء المتصلون',
      all: 'كل الأصدقاء',
      empty: 'لا أحد من أصدقائك متصل الآن.',
      noFriends: 'أضف أصدقاء لتعرف متى يكونون متصلين.',
      challenge: 'تحدَّ',
      challengeName: 'تحدَّ {{name}}',
    },
  },
};
