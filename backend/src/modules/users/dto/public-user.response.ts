import { ApiProperty } from '@nestjs/swagger';

// WHY THIS FILE EXISTS
// Documentation only. It describes, for the Swagger page, the user object
// that toPublicUser() (../public-user.ts) returns. The fields must stay in
// sync with that function. Nothing here changes how the API behaves.
export class PublicUserResponse {
  @ApiProperty({ example: '2082b753-ec3c-480d-9ebb-edcfdb5ce293' })
  id: string;

  @ApiProperty({ example: 'mario@example.com' })
  email: string;

  @ApiProperty({ example: 'mario' })
  displayName: string;

  @ApiProperty({ type: String, nullable: true, example: null })
  avatarUrl: string | null;

  @ApiProperty({ example: 'en', description: 'Interface language: en, fr or ar' })
  locale: string;
}
