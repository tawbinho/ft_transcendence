import { OfflineGamePage } from './offline/OfflineGamePage';

/** /play/computer: one person against the computer. */
export function ComputerGamePage() {
  return <OfflineGamePage mode="computer" />;
}
