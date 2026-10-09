const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The server gives every match, tournament and user a UUID: anything else cannot be an id. */
export function isUuid(value: string): boolean {
  return UUID.test(value);
}
