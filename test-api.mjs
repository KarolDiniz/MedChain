/**
 * Script para testar cadastro e login de médico.
 * Execute: node test-api.mjs
 * Pré-requisito: backend rodando (uvicorn app.main:app --reload)
 */
const API = 'http://localhost:8000/api/v1';

async function test() {
  const email = `teste.${Date.now()}@medchain.com`;
  const data = {
    full_name: 'Dr Teste',
    email,
    password: '123456',
    CRM: '77777-SP',
    specialty: 'Clínica Geral',
  };

  console.log('1. Registrando médico...');
  try {
    const r = await fetch(`${API}/auth/register-doctor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const text = await r.text();
    const res = text ? (() => { try { return JSON.parse(text); } catch { return { detail: text }; }})() : {};
    if (!r.ok) throw new Error(res.detail || text || `HTTP ${r.status}`);
    console.log('   OK - role:', res.user?.role);
  } catch (e) {
    console.log('   ERRO:', e.message);
    if (e.message.includes('fetch')) {
      console.log('\n   >>> Backend rodando? Execute: cd MedChain && uvicorn app.main:app --reload');
    }
    return;
  }

  console.log('\n2. Fazendo login...');
  try {
    const r = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: '123456' }),
    });
    const text = await r.text();
    const res = text ? (() => { try { return JSON.parse(text); } catch { return { detail: text }; }})() : {};
    if (!r.ok) throw new Error(res.detail || text || `HTTP ${r.status}`);
    console.log('   OK - role:', res.user?.role, '| Redireciona para:', res.user?.role === 'doctor' ? '/doctor' : '/patient');
  } catch (e) {
    console.log('   ERRO:', e.message);
  }
}

test();
