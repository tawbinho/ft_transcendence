import { ChatIllustration } from './ChatIllustration';
import { EmptyBoardIllustration } from './EmptyBoardIllustration';
import { NotFoundIllustration } from './NotFoundIllustration';
import { TrophyIllustration } from './TrophyIllustration';

export { ChatIllustration, EmptyBoardIllustration, NotFoundIllustration, TrophyIllustration };

/** The illustrations by name, for components that let the caller choose one. */
export const ILLUSTRATIONS = {
  board: EmptyBoardIllustration,
  trophy: TrophyIllustration,
  chat: ChatIllustration,
  notFound: NotFoundIllustration,
};

export type IllustrationName = keyof typeof ILLUSTRATIONS;
