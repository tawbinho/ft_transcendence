import type { TournamentsMessages } from '../en/tournaments';

export const tournamentsMessages: TournamentsMessages = {
  tournaments: {
    title: 'Tournois',
    subtitle:
      'Élimination directe : gagnez votre match pour passer au tour suivant, jusqu’à ce qu’il ne reste qu’un joueur.',
    onlineTitle: 'Tournois en ligne',
    onlineBody:
      'Créez un tournoi ou rejoignez-en un. Chaque match se joue en ligne et le tableau se met à jour tout seul.',
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
      'Vous êtes inscrit automatiquement. Il commence quand il est complet, ou plus tôt si vous le lancez avec au moins {{min}} joueurs.',
    name: 'Nom',
    nameHint: 'De 3 à 30 caractères.',
    size: 'Joueurs',
    sizeOption: '{{count}} joueurs',
    notFoundTitle: 'Tournoi introuvable',
    createdBy: 'Créé par {{name}}',
    registrationOpen: 'Les inscriptions sont ouvertes',
    registrationBody:
      'Le tournoi commence dès que {{size}} joueurs sont inscrits. Son créateur peut aussi le lancer avec au moins {{min}} joueurs.',
    join: 'S’inscrire',
    leave: 'Se désinscrire',
    startNow: 'Lancer maintenant',
    startUnavailable:
      'Le serveur ne peut pas encore lancer de tournoi. Les inscriptions fonctionnent ; les matchs viendront plus tard.',
    fullWaiting:
      'Toutes les places sont prises, mais le serveur ne peut pas encore lancer le tournoi : il reste ouvert.',
    needMorePlayers: 'Il faut au moins {{min}} joueurs pour commencer.',
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
    quarterFinals: 'Quarts de finale',
    round: 'Tour {{n}}',
    bye: 'Exempt',
    toBeDecided: 'À déterminer',
    championTitle: 'Champion',
    filterLabel: 'Afficher',
    yourMatch: 'Votre match',
  },
};
