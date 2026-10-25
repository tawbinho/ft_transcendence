import type { TournamentsMessages } from '../en/tournaments';

export const tournamentsMessages: TournamentsMessages = {
  tournaments: {
    title: 'Tournois',
    subtitle:
      'Élimination directe : gagnez votre match pour passer au tour suivant, jusqu’à ce qu’il ne reste qu’un joueur.',
    listTitle: 'Tous les tournois en ligne',
    loginRequired: 'Connectez-vous pour rejoindre les tournois en ligne.',
    create: 'Créer un tournoi',
    empty: 'Aucun tournoi ici pour l’instant.',
    filters: {
      all: 'Tous',
      registering: 'Ouverts',
      running: 'En cours',
      finished: 'Terminés',
    },
    status: {
      registering: 'Inscriptions ouvertes',
      running: 'En cours',
      finished: 'Terminé',
    },
    joined: 'Inscrit',
    playerCount: '{{count}}/{{size}} joueurs',
    winner: 'Vainqueur',
    newTitle: 'Nouveau tournoi',
    newSubtitle:
      'Vous êtes inscrit automatiquement. Il commence tout seul quand le 4e joueur s’inscrit : deux demi-finales, puis la finale.',
    name: 'Nom',
    nameHint: 'De 3 à 30 caractères.',
    notFoundTitle: 'Tournoi introuvable',
    createdBy: 'Créé par {{name}}',
    registrationOpen: 'Les inscriptions sont ouvertes',
    registrationBody:
      'Deux demi-finales, puis la finale. Les matchs commencent tout seuls quand la dernière place est prise.',
    waitingForPlayers: 'En attente de {{size}} joueurs pour commencer ({{count}}/{{size}}).',
    join: 'S’inscrire',
    leave: 'Se désinscrire',
    delete: 'Annuler le tournoi',
    deleteTitle: 'Annuler ce tournoi ?',
    deleteBody: 'Les joueurs inscrits seront retirés et le tournoi disparaîtra.',
    yourMatchReady: 'Votre match contre {{name}} est prêt.',
    play: 'Jouer',
    champion: '{{name}} remporte le tournoi !',
    bracket: 'Tableau',
    players: 'Joueurs',
    final: 'Finale',
    semiFinals: 'Demi-finales',
    toBeDecided: 'À déterminer',
    championTitle: 'Champion',
    filterLabel: 'Afficher',
    yourMatch: 'Votre match',
  },
};
