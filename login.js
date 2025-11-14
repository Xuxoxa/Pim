// login.js
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('error-message');

  errorMsg.textContent = '';

  // 🔹 Verifica se o e-mail é de professor e possui domínio válido
  if (email.includes('@') && email.toLowerCase().includes('prof') && !email.endsWith('@iagora.com')) {
    errorMsg.textContent = '❌ Apenas professores com e-mail @iagora.com podem acessar.';
    errorMsg.style.color = 'red';
    return;
  }

  try {
    const response = await fetch('http://localhost:4000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      errorMsg.textContent = data.error || 'Falha no login. Verifique seus dados.';
      return;
    }

    console.log('✅ Login bem-sucedido:', data);

    // 🔹 Salva no localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('userName', data.name || 'Usuário');
    localStorage.setItem('userEmail', data.email);

    // 🔹 Verifica se é professor (domínio @iagora.com)
    if (data.email.endsWith('@iagora.com')) {
      window.location.href = 'navegacao2.html'; // Professor
    } else {
      window.location.href = 'navegacao.html'; // Aluno
    }

  } catch (err) {
    console.error('❌ Erro ao conectar ao servidor:', err);
    errorMsg.textContent = 'Erro ao conectar ao servidor.';
  }
});
