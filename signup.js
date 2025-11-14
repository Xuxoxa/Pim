console.log('🚀 signup.js carregado');

const form = document.getElementById('signupForm');
console.log('📄 Form encontrado:', form);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('🧩 Formulário enviado');

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('error-message');

  errorMsg.textContent = '';

  try {
    const response = await fetch('http://localhost:4000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    console.log('🛰️ Resposta bruta:', response);

    const data = await response.json().catch(() => ({}));
    console.log('📦 Dados recebidos do backend:', data);

    if (!response.ok) {
      errorMsg.textContent = data.error || 'Erro ao criar conta.';
      return;
    }

    alert('✅ Conta criada com sucesso!');
    window.location.href = 'home.html';

  } catch (err) {
    console.error('❌ Erro ao conectar ao servidor:', err);
    errorMsg.textContent = 'Erro ao conectar ao servidor.';
  }
});
