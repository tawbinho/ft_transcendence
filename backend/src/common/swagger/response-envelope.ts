import type { OpenAPIObject } from '@nestjs/swagger';

// WHY THIS FILE EXISTS
// Every real response of the API is wrapped by ResponseInterceptor:
//   success -> { "data": <what the controller returned> }
//   failure -> { "error": { "code": "...", "message": "..." } }
// but Swagger only documents what the controller returns, without the
// wrapper. So the generated document would show the wrong shapes to whoever
// builds the frontend. Instead of repeating a wrapper on every route, this
// function rewrites the finished document once at startup, so every route
// (including those added later) is documented correctly.

const ERROR_SCHEMA = 'ErrorResponse';

type Loose = Record<string, any>;

export function applyResponseEnvelope(document: OpenAPIObject): OpenAPIObject {
  // The shape of every failure, referenced by all routes below.
  const schemas = ((document.components ??= {}).schemas ??= {}) as Loose;
  schemas[ERROR_SCHEMA] = {
    type: 'object',
    required: ['error'],
    properties: {
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: {
            type: 'string',
            example: 'EMAIL_TAKEN',
            description: 'Stable identifier. Use it to pick the translated message.',
          },
          message: { type: 'string', example: 'This email is already registered' },
        },
      },
    },
  };

  for (const path of Object.values(document.paths) as Loose[]) {
    for (const operation of Object.values(path) as Loose[]) {
      if (!operation?.responses) continue;

      for (const [status, response] of Object.entries<Loose>(operation.responses)) {
        if (!status.startsWith('2')) continue;
        const content = (response.content ??= {});
        const json = content['application/json'];
        // A route that returns nothing still answers { "data": null }.
        const inner = json?.schema ?? { nullable: true, example: null };
        content['application/json'] = {
          schema: {
            type: 'object',
            required: ['data'],
            properties: { data: inner },
          },
        };
      }

      // Anything that is not a success is an error with the shape above.
      operation.responses.default = {
        description:
          'Error. Common codes: VALIDATION_ERROR (400), UNAUTHORIZED (401), RATE_LIMITED (429).',
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${ERROR_SCHEMA}` },
          },
        },
      };
    }
  }
  return document;
}
