// WHY THIS FILE EXISTS
// Allowed values of the users routes in one place, shared by the validation
// (DTO) and the service.

// How the Players page can order its list:
//  name    A to Z
//  wins    most wins first, then by name
//  newest  newest account first
export const USER_SORTS = ['name', 'wins', 'newest'] as const;
export type UserSort = (typeof USER_SORTS)[number];
