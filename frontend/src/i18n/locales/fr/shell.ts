import type { ShellMessages } from '../en/shell';

export const shellMessages: ShellMessages = {
  nav: {
    main: 'Navigation principale',
    skipToContent: 'Aller au contenu',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    play: 'Jouer',
    matches: 'Mes parties',
    account: 'Compte',
    login: 'Se connecter',
    signup: 'S’inscrire',
    logout: 'Se déconnecter',
    tournaments: 'Tournois',
    watch: 'Regarder',
    players: 'Joueurs',
    friends: 'Amis',
    chat: 'Messages',
    profile: 'Mon profil',
    accountMenu: 'Menu du compte',
    newCount: 'nouveaux : {{count}}',
  },
  preferences: {
    language: 'Langue',
    appearance: 'Apparence',
    system: 'Système',
    light: 'Clair',
    dark: 'Sombre',
  },
  demo: {
    title: 'Données de démonstration.',
    body: 'Ces parties utilisent des joueurs fictifs gardés dans ce navigateur, en attendant que le serveur les prenne en charge : {{features}}.',
    features: {
      users: 'joueurs et profils',
      friends: 'amis',
      chat: 'messages',
      spectate: 'regarder des parties',
      tournaments: 'tournois en ligne',
    },
    reset: 'Réinitialiser la démo',
    resetTitle: 'Réinitialiser les données de démonstration ?',
    resetBody:
      'Les joueurs fictifs, les messages et les tournois repartent de zéro. Votre compte et vos vraies parties ne changent pas.',
  },
  footer: {
    privacy: 'Politique de confidentialité',
    terms: 'Conditions d’utilisation',
    project: 'Un projet ft_transcendence de 42.',
  },
};
