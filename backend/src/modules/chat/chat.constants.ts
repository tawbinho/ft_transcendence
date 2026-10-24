// The allowed values of the chat module in ONE place, shared by the database
// entities, the validation (DTOs) and the service.

// What a message is:
//  text    written by a player
//  invite  a player invites the other to a match they created for them
//  system  written by the server (for example "your tournament match is ready")
export const MESSAGE_KINDS = ['text', 'invite', 'system'] as const;
export type MessageKind = (typeof MESSAGE_KINDS)[number];

// What a system message announces. The app writes the sentence itself, in the
// reader's language.
export const SYSTEM_EVENTS = ['tournament_match'] as const;
export type SystemEvent = (typeof SYSTEM_EVENTS)[number];

export const MESSAGE_MAX_LENGTH = 500;

// Reading a conversation: how many messages by default and at most.
export const DEFAULT_PAGE_SIZE = 30;
export const MAX_PAGE_SIZE = 100;

// Sending messages is limited per minute per address, against floods.
export const SEND_LIMIT_PER_MINUTE = 30;
