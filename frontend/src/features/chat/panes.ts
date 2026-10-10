/**
 * Which half of the chat page a phone shows. A wide screen shows the list and
 * the conversation side by side; a phone has room for one: the conversation
 * once a player is picked (/chat/bob), the list otherwise (/chat).
 */
export function phonePane(displayName: string | undefined): 'list' | 'conversation' {
  return displayName ? 'conversation' : 'list';
}
