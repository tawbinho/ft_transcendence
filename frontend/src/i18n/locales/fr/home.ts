import type { HomeMessages } from '../en/home';

export const homeMessages: HomeMessages = {
  home: {
    title: 'Quatre à la suite. Mille façons de jouer.',
    subtitle:
      'Lâchez vos jetons, alignez-en quatre avant votre adversaire et choisissez votre défi : un ami sur le même écran, l’ordinateur ou un joueur en ligne.',
    playNow: 'Jouer maintenant',
    createAccount: 'Créer un compte',
    modesTitle: 'Façons de jouer',
    local: {
      title: 'Même écran',
      body: 'Deux joueurs jouent à tour de rôle sur un seul appareil. Aucun compte requis.',
    },
    computer: {
      title: 'Contre l’ordinateur',
      body: 'Trois niveaux, du plus détendu au plus impitoyable. Aucun compte requis.',
    },
    online: { title: 'En ligne', body: 'Créez une partie, envoyez le lien et affrontez un ami où qu’il soit.' },
    customTitle: 'Votre plateau, vos règles',
    customBody: 'De 5 à 10 colonnes et de 5 à 9 rangées, alignez 3, 4 ou 5 jetons et choisissez vos couleurs.',
    onlineGuestTitle: 'Inscrivez-vous pour jouer en ligne',
    points: {
      title: 'Et ce n’est pas tout',
      tournaments: {
        title: 'Tournois',
        body: 'Organisez un tableau entre amis sur un seul écran, ou rejoignez un tournoi en ligne.',
      },
      community: {
        title: 'Amis et messages',
        body: 'Ajoutez des amis, discutez avec eux et regardez les parties en direct.',
      },
    },
    greeting: {
      morning: 'Bonjour, {{name}}',
      afternoon: 'Bon après-midi, {{name}}',
      evening: 'Bonsoir, {{name}}',
    },
    dashboardSubtitle: 'Reprenez là où vous vous étiez arrêté.',
    quick: {
      title: 'Lancer une partie',
      online: 'Nouvelle partie en ligne',
      computer: 'Contre l’ordinateur',
      local: 'Même écran',
      tournaments: 'Tournois',
    },
    yourTurn: {
      title: 'À vous de jouer',
      all: 'Toutes les parties',
      empty: 'Aucune partie n’attend votre coup.',
      others: 'Parties en cours : {{count}}.',
      versus: 'Contre {{name}}',
      move: 'À vous',
    },
    recent: {
      title: 'Résultats récents',
      all: 'Toutes les parties',
      empty: 'Vos parties terminées apparaîtront ici.',
    },
    friendsOnline: {
      title: 'Amis en ligne',
      all: 'Tous les amis',
      empty: 'Aucun de vos amis n’est en ligne pour le moment.',
      noFriends: 'Ajoutez des amis pour voir quand ils sont en ligne.',
      challenge: 'Défier',
      challengeName: 'Défier {{name}}',
    },
    live: {
      title: 'Parties en direct',
      watch: 'Regarder',
      count: 'Parties en cours en ce moment : {{count}}',
      none: 'Aucune partie en cours pour le moment.',
    },
  },
};
