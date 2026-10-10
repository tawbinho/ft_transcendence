import type { Language } from '@/i18n';

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export interface LegalDocument {
  intro: string;
  sections: LegalSection[];
}

/** When the texts below last changed (ISO date). */
export const LEGAL_UPDATED = '2026-10-08';

// Long-form legal texts live here rather than in the translation files. Keep
// the three languages in step when the data the app stores changes.

export const privacy: Record<Language, LegalDocument> = {
  en: {
    intro:
      'Connect Four is a student project made for the 42 ft_transcendence curriculum. This policy explains which personal data the site keeps, why, and what you can do about it.',
    sections: [
      {
        title: 'What we store',
        paragraphs: [
          'Your account: email address, display name and password. The password is never stored as typed: only a salted hash (Argon2) is kept.',
          'Two-factor authentication, if you turn it on: the shared secret used to check your codes, stored encrypted.',
          'Your login sessions: a random identifier kept in a secure, httpOnly cookie named "session", valid for 7 days or until you log out.',
          'Your profile picture, if you add one. It is cropped and reduced to 256 × 256 pixels in your browser before being sent. Other players can see it.',
          'Your online games: who played, every move, the result and the dates. Other players of a match can see it, and logged-in players can watch matches in progress.',
          'Your friends, your friend requests and the players you block. Your private messages, with the time they were read: a conversation is only visible to its two players.',
          'Your tournaments: the ones you create or join, and their results, visible to logged-in players.',
          'Whether you are online, and when you were last seen, which other logged-in players can see.',
        ],
      },
      {
        title: 'What stays in your browser',
        paragraphs: [
          'Your language and appearance choices are saved in your browser’s local storage. Games on the same screen or against the computer are played entirely in your browser and are never sent to the server.',
          'Until the server provides them, some features (marked by a “Demo data” banner) run in your browser with made-up players. What you do with them, such as messages or friend requests, is saved only in your browser and is erased by “Reset demo”.',
        ],
      },
      {
        title: 'Why we use it',
        paragraphs: [
          'Only to run the game: log you in, protect your account, let you play and chat with other players, and show your history and statistics. There is no advertising, no tracking and no data sold or shared with third parties.',
        ],
      },
      {
        title: 'Security',
        paragraphs: [
          'Every connection to the site is encrypted with HTTPS. Login attempts are rate limited, and you can add a second factor to your account.',
        ],
      },
      {
        title: 'Your rights',
        paragraphs: [
          'Under the GDPR you can ask to see, correct, export or delete your data. Contact the project team at your 42 campus; your account and its data are removed on request.',
        ],
      },
    ],
  },
  fr: {
    intro:
      'Puissance 4 est un projet étudiant réalisé dans le cadre du cursus ft_transcendence de 42. Cette politique explique quelles données personnelles le site conserve, pourquoi, et ce que vous pouvez faire à ce sujet.',
    sections: [
      {
        title: 'Ce que nous conservons',
        paragraphs: [
          'Votre compte : adresse e-mail, pseudo et mot de passe. Le mot de passe n’est jamais conservé tel quel : seule une empreinte salée (Argon2) est gardée.',
          'L’authentification à deux facteurs, si vous l’activez : le secret partagé servant à vérifier vos codes, stocké chiffré.',
          'Vos sessions de connexion : un identifiant aléatoire dans un cookie sécurisé et httpOnly nommé « session », valable 7 jours ou jusqu’à la déconnexion.',
          'Votre photo de profil, si vous en ajoutez une. Elle est recadrée et réduite à 256 × 256 pixels dans votre navigateur avant l’envoi. Les autres joueurs peuvent la voir.',
          'Vos parties en ligne : les joueurs, chaque coup, le résultat et les dates. Les autres joueurs d’une partie peuvent la consulter, et les joueurs connectés peuvent regarder les parties en cours.',
          'Vos amis, vos demandes d’ami et les joueurs que vous bloquez. Vos messages privés, avec l’heure de leur lecture : une conversation n’est visible que par ses deux participants.',
          'Vos tournois : ceux que vous créez ou rejoignez, et leurs résultats, visibles par les joueurs connectés.',
          'Votre présence en ligne et l’heure de votre dernière visite, visibles par les autres joueurs connectés.',
        ],
      },
      {
        title: 'Ce qui reste dans votre navigateur',
        paragraphs: [
          'Vos choix de langue et d’apparence sont enregistrés dans le stockage local de votre navigateur. Les parties sur le même écran ou contre l’ordinateur se jouent entièrement dans votre navigateur et ne sont jamais envoyées au serveur.',
          'En attendant que le serveur les prenne en charge, certaines fonctions (signalées par un bandeau « Données de démonstration ») tournent dans votre navigateur avec des joueurs fictifs. Ce que vous y faites, comme vos messages ou vos demandes d’ami, est enregistré uniquement dans votre navigateur et effacé par « Réinitialiser la démo ».',
        ],
      },
      {
        title: 'Pourquoi nous les utilisons',
        paragraphs: [
          'Uniquement pour faire fonctionner le jeu : vous connecter, protéger votre compte, vous permettre de jouer et de discuter avec d’autres joueurs, et afficher votre historique et vos statistiques. Aucune publicité, aucun pistage, et aucune donnée vendue ou partagée avec des tiers.',
        ],
      },
      {
        title: 'Sécurité',
        paragraphs: [
          'Toutes les connexions au site sont chiffrées en HTTPS. Les tentatives de connexion sont limitées, et vous pouvez ajouter un second facteur à votre compte.',
        ],
      },
      {
        title: 'Vos droits',
        paragraphs: [
          'Conformément au RGPD, vous pouvez demander à consulter, corriger, exporter ou supprimer vos données. Contactez l’équipe du projet sur votre campus 42 ; votre compte et ses données sont supprimés sur demande.',
        ],
      },
    ],
  },
  ar: {
    intro:
      '«أربعة في صف» مشروع طلابي أُنجز ضمن منهج ft_transcendence في مدرسة 42. توضّح هذه السياسة البيانات الشخصية التي يحتفظ بها الموقع، ولماذا، وما يمكنك فعله بشأنها.',
    sections: [
      {
        title: 'ما نحتفظ به',
        paragraphs: [
          'حسابك: البريد الإلكتروني والاسم الظاهر وكلمة المرور. لا تُحفظ كلمة المرور كما كتبتها أبدًا، بل تُحفظ بصمة مملّحة منها فقط (Argon2).',
          'المصادقة الثنائية إن فعّلتها: السر المشترك المستخدم للتحقق من رموزك، محفوظًا بشكل مشفّر.',
          'جلسات تسجيل الدخول: معرّف عشوائي في ملف تعريف ارتباط آمن من نوع httpOnly اسمه «session»، صالح لمدة 7 أيام أو حتى تسجيل الخروج.',
          'صورتك الشخصية إن أضفتها. تُقصّ وتُصغَّر إلى 256 × 256 بكسل في متصفحك قبل إرسالها. يمكن للاعبين الآخرين رؤيتها.',
          'مبارياتك عبر الإنترنت: اللاعبون وكل حركة والنتيجة والتواريخ. يمكن للاعبين الآخرين في المباراة الاطلاع عليها، ويمكن للاعبين المسجّلين مشاهدة المباريات الجارية.',
          'أصدقاؤك وطلبات الصداقة واللاعبون الذين تحظرهم، ورسائلك الخاصة مع وقت قراءتها: لا يرى المحادثة إلا طرفاها.',
          'بطولاتك: التي تنشئها أو تنضم إليها ونتائجها، ويمكن للاعبين المسجّلين رؤيتها.',
          'حالة اتصالك ووقت آخر ظهور لك، ويمكن للاعبين المسجّلين الآخرين رؤيتهما.',
        ],
      },
      {
        title: 'ما يبقى في متصفحك',
        paragraphs: [
          'تُحفظ اختياراتك للغة والمظهر في التخزين المحلي لمتصفحك. أما المباريات على الشاشة نفسها أو ضد الحاسوب فتُلعب بالكامل في متصفحك ولا تُرسل إلى الخادم أبدًا.',
          'إلى أن يدعمها الخادم، تعمل بعض الميزات (المشار إليها بشريط «بيانات تجريبية») في متصفحك مع لاعبين وهميين. ما تفعله فيها، كالرسائل أو طلبات الصداقة، يُحفظ في متصفحك فقط ويُمحى عند «إعادة ضبط العرض التجريبي».',
        ],
      },
      {
        title: 'لماذا نستخدمها',
        paragraphs: [
          'لتشغيل اللعبة فقط: تسجيل دخولك، وحماية حسابك، وتمكينك من اللعب والدردشة مع اللاعبين الآخرين، وعرض سجلّك وإحصاءاتك. لا إعلانات ولا تتبّع، ولا تُباع أي بيانات ولا تُشارك مع أطراف ثالثة.',
        ],
      },
      {
        title: 'الأمان',
        paragraphs: [
          'جميع الاتصالات بالموقع مشفّرة عبر HTTPS. محاولات تسجيل الدخول محدودة، ويمكنك إضافة عامل ثانٍ إلى حسابك.',
        ],
      },
      {
        title: 'حقوقك',
        paragraphs: [
          'بموجب اللائحة العامة لحماية البيانات (GDPR) يمكنك طلب الاطلاع على بياناتك أو تصحيحها أو تصديرها أو حذفها. تواصل مع فريق المشروع في حرم 42 الخاص بك، ويُحذف حسابك وبياناته عند الطلب.',
        ],
      },
    ],
  },
};

export const terms: Record<Language, LegalDocument> = {
  en: {
    intro:
      'By creating an account or playing on this site you accept these terms. The site is a non-commercial educational project, provided as is, without any guarantee.',
    sections: [
      {
        title: 'Your account',
        paragraphs: [
          'Keep your password to yourself, and choose a display name and a profile picture that do not insult or impersonate anyone and that you have the right to use. You are responsible for what happens with your account.',
        ],
      },
      {
        title: 'Fair play and respect',
        paragraphs: [
          'Do not cheat, exploit bugs, or try to disrupt the service or other players. Be respectful in chat: harassment, hate speech and spam are not allowed. You can block any player.',
        ],
      },
      {
        title: 'Availability',
        paragraphs: [
          'The service can change, stop or lose data at any time, for example between versions of the project. Matches in progress may be lost when the server restarts.',
        ],
      },
      {
        title: 'Moderation',
        paragraphs: ['The project team may remove content or close accounts that break these rules.'],
      },
      {
        title: 'Changes',
        paragraphs: [
          'These terms can be updated; the date at the top shows the latest version. Continuing to use the site means you accept the new version.',
        ],
      },
    ],
  },
  fr: {
    intro:
      'En créant un compte ou en jouant sur ce site, vous acceptez ces conditions. Le site est un projet pédagogique non commercial, fourni tel quel, sans aucune garantie.',
    sections: [
      {
        title: 'Votre compte',
        paragraphs: [
          'Gardez votre mot de passe pour vous, et choisissez un pseudo et une photo de profil qui n’insultent ni n’usurpent l’identité de personne et que vous avez le droit d’utiliser. Vous êtes responsable de ce qui se passe avec votre compte.',
        ],
      },
      {
        title: 'Fair-play et respect',
        paragraphs: [
          'Ne trichez pas, n’exploitez pas les bugs et n’essayez pas de perturber le service ou les autres joueurs. Restez respectueux dans le chat : le harcèlement, les propos haineux et le spam sont interdits. Vous pouvez bloquer n’importe quel joueur.',
        ],
      },
      {
        title: 'Disponibilité',
        paragraphs: [
          'Le service peut changer, s’arrêter ou perdre des données à tout moment, par exemple entre deux versions du projet. Les parties en cours peuvent être perdues au redémarrage du serveur.',
        ],
      },
      {
        title: 'Modération',
        paragraphs: ['L’équipe du projet peut retirer des contenus ou fermer les comptes qui enfreignent ces règles.'],
      },
      {
        title: 'Modifications',
        paragraphs: [
          'Ces conditions peuvent être mises à jour ; la date en haut indique la dernière version. Continuer à utiliser le site vaut acceptation de la nouvelle version.',
        ],
      },
    ],
  },
  ar: {
    intro:
      'بإنشائك حسابًا أو لعبك على هذا الموقع فإنك تقبل هذه الشروط. الموقع مشروع تعليمي غير تجاري، يُقدَّم كما هو ومن دون أي ضمان.',
    sections: [
      {
        title: 'حسابك',
        paragraphs: [
          'احتفظ بكلمة مرورك لنفسك، واختر اسمًا ظاهرًا وصورة شخصية لا يسيئان إلى أحد ولا ينتحلان شخصية أحد ويحق لك استخدامهما. أنت مسؤول عمّا يحدث في حسابك.',
        ],
      },
      {
        title: 'اللعب النظيف والاحترام',
        paragraphs: [
          'لا تغشّ، ولا تستغلّ الأخطاء البرمجية، ولا تحاول تعطيل الخدمة أو إزعاج اللاعبين الآخرين. التزم الاحترام في الدردشة: التحرّش وخطاب الكراهية والرسائل المزعجة ممنوعة. يمكنك حظر أي لاعب.',
        ],
      },
      {
        title: 'التوفّر',
        paragraphs: [
          'قد تتغيّر الخدمة أو تتوقف أو تفقد بيانات في أي وقت، مثلًا بين إصدارات المشروع. قد تضيع المباريات الجارية عند إعادة تشغيل الخادم.',
        ],
      },
      {
        title: 'الإشراف',
        paragraphs: ['يحق لفريق المشروع حذف المحتوى أو إغلاق الحسابات التي تخالف هذه القواعد.'],
      },
      {
        title: 'التعديلات',
        paragraphs: [
          'قد تُحدَّث هذه الشروط، ويشير التاريخ في الأعلى إلى أحدث إصدار. يُعدّ استمرارك في استخدام الموقع قبولًا للإصدار الجديد.',
        ],
      },
    ],
  },
};
