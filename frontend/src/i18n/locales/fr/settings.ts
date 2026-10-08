import type { SettingsMessages } from '../en/settings';

export const settingsMessages: SettingsMessages = {
  account: {
    title: 'Compte',
    profile: 'Profil',
    displayName: 'Pseudo',
    email: 'E-mail',
    preferences: 'Préférences',
    session: 'Session',
    logoutBody: 'Se déconnecter de ce navigateur.',
    viewProfile: 'Voir mon profil',
    addPicture: 'Ajouter une photo',
    changePicture: 'Changer de photo',
    removePicture: 'Supprimer la photo',
    pictureHint: 'PNG, JPEG ou WebP. Elle est recadrée en carré.',
    displayNameHint: 'De 3 à 20 lettres, chiffres, _ ou -. Les autres joueurs vous trouvent par ce nom.',
    saveName: 'Enregistrer le nom',
    nameSaved: 'Nom d’affichage enregistré.',
  },
  twoFactor: {
    title: 'Authentification à deux facteurs',
    body: 'Demander un code d’une application d’authentification, en plus du mot de passe, à chaque connexion.',
    on: 'Activée',
    off: 'Désactivée',
    turnOn: 'Activer',
    turnOff: 'Désactiver',
    scan: 'Scannez ce QR code avec votre application d’authentification, puis saisissez le code affiché.',
    qrAlt: 'QR code pour votre application d’authentification',
    manualKey: 'Impossible de scanner ? Saisissez plutôt cette clé :',
    confirmOn: 'Confirmer et activer',
    offBody:
      'Saisissez un code de votre application d’authentification pour désactiver l’authentification à deux facteurs.',
    confirmOff: 'Désactiver',
    enabled: 'L’authentification à deux facteurs est activée.',
    disabled: 'L’authentification à deux facteurs est désactivée.',
  },
};
