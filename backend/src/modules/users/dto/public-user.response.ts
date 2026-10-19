
// WHY THIS FILE EXISTS
// Documentation only. It describes, for the Swagger page, the user object
// that toPublicUser() (../public-user.ts) returns. The fields must stay in
// sync with that function. Nothing here changes how the API behaves.
export class PublicUserResponse {
  id: string;

  email: string;

  displayName: string;

  avatarUrl: string | null;

  locale: string;
}
