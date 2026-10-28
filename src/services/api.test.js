import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function storeUser(overrides = {}) {
  localStorage.setItem(
    'medchain_user',
    JSON.stringify({
      access_token: 'access-old',
      refresh_token: 'refresh-1',
      email: 'doc@test.com',
      ...overrides,
    }),
  );
}

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe('api client', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    localStorage.clear();
    vi.resetModules();
  });

  it('envia Authorization e retorna payload em sucesso', async () => {
    storeUser();
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 1 }));

    const { api } = await import('./api');
    const data = await api.get('/patients/');

    expect(data).toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/patients/');
    expect(options.headers.Authorization).toBe('Bearer access-old');
  });

  it('formata erro de validação Pydantic (array detail)', async () => {
    storeUser();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          detail: [
            { loc: ['body', 'email'], msg: 'value is not a valid email address' },
            { loc: ['body', 'password'], msg: 'String should have at least 8 characters' },
          ],
        },
        422,
      ),
    );

    const { api } = await import('./api');
    await expect(api.post('/auth/login', {})).rejects.toThrow(
      /e-mail válido|pelo menos 8 caracteres/i,
    );
  });

  it('renova token em 401 e repete a requisição', async () => {
    storeUser();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ detail: 'expired' }, 401))
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'access-new', refresh_token: 'refresh-2' }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const { api } = await import('./api');
    const data = await api.get('/doctors/');

    expect(data).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const stored = JSON.parse(localStorage.getItem('medchain_user'));
    expect(stored.access_token).toBe('access-new');
    expect(stored.refresh_token).toBe('refresh-2');

    const retryHeaders = fetchMock.mock.calls[2][1].headers;
    expect(retryHeaders.Authorization).toBe('Bearer access-new');
  });

  it('dispara logout quando refresh falha após 401', async () => {
    storeUser();
    const logoutListener = vi.fn();
    window.addEventListener('medchain:logout', logoutListener);

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ detail: 'expired' }, 401))
      .mockResolvedValueOnce(jsonResponse({ detail: 'invalid refresh' }, 401));

    const { api } = await import('./api');
    await expect(api.get('/doctors/')).rejects.toBeTruthy();

    expect(localStorage.getItem('medchain_user')).toBeNull();
    expect(logoutListener).toHaveBeenCalled();
    expect(logoutListener.mock.calls[0][0].detail.reason).toBe('expired');

    window.removeEventListener('medchain:logout', logoutListener);
  });

  it('monta query string em medicalRecordsApi.list', async () => {
    storeUser();
    fetchMock.mockResolvedValue(jsonResponse({ consultations: [] }));

    const { medicalRecordsApi } = await import('./api');
    await medicalRecordsApi.list('consultation', 'doc-1');

    expect(fetchMock.mock.calls[0][0]).toContain(
      '/medical-records/?type=consultation&doctor_id=doc-1',
    );
  });

  it('upload de arquivo propaga erro formatado quando resposta não é ok', async () => {
    storeUser();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ detail: 'field required' }, 400),
    );

    const { filesApi } = await import('./api');
    await expect(filesApi.upload(new FormData())).rejects.toThrow('Campo obrigatório.');
  });
});
