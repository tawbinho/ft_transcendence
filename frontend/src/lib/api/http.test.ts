import { ApiError } from './errors';
import { http, request, sendOverNetwork, setTransport } from './http';

function mockFetch(status: number, body: unknown) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(text, { status, statusText: 'Status' }));
}

describe('request', () => {
  it('unwraps the data envelope and sends the session cookie', async () => {
    const fetchMock = mockFetch(200, { data: { id: 1 } });

    await expect(http.get('/auth/me')).resolves.toEqual({ id: 1 });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/auth/me');
    expect(init?.credentials).toBe('include');
  });

  it('serialises the body and the query string', async () => {
    const fetchMock = mockFetch(200, { data: null });

    await request('/matches/mine', {
      method: 'POST',
      body: { col: 3 },
      query: { limit: 20, status: undefined, offset: 0 },
    });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/matches/mine?limit=20&offset=0');
    expect(init?.body).toBe('{"col":3}');
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
  });

  it('turns the error envelope into an ApiError', async () => {
    mockFetch(409, { error: { code: 'NOT_YOUR_TURN', message: 'It is not your turn' } });

    const error = await http.post('/matches/x/moves', { col: 1 }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'NOT_YOUR_TURN', status: 409 });
  });

  it('reports a proxy error page as SERVER_UNAVAILABLE', async () => {
    mockFetch(502, '<html>Bad Gateway</html>');
    await expect(http.get('/auth/me')).rejects.toMatchObject({ code: 'SERVER_UNAVAILABLE' });
  });

  it('reports an unreachable server as NETWORK_ERROR', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(http.get('/auth/me')).rejects.toMatchObject({ code: 'NETWORK_ERROR', status: 0 });
  });

  it('rejects a success without the data envelope', async () => {
    mockFetch(200, { something: 'else' });
    await expect(http.get('/auth/me')).rejects.toMatchObject({ code: 'BAD_RESPONSE' });
  });

  it('sends FormData as is, letting the browser set the multipart header', async () => {
    const fetchMock = mockFetch(200, { data: null });
    const form = new FormData();
    form.set('avatar', new Blob(['x'], { type: 'image/png' }), 'a.png');

    await http.put('/users/me/avatar', form);

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init?.method).toBe('PUT');
    expect(init?.body).toBe(form);
    expect(new Headers(init?.headers).has('Content-Type')).toBe(false);
  });

  it('lets another transport answer instead of the network', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    setTransport(async (req) => ({ status: 200, payload: { data: `${req.method} ${req.path}` } }));
    try {
      await expect(http.delete('/friends/42')).resolves.toBe('DELETE /friends/42');
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      setTransport(sendOverNetwork);
    }
  });
});
