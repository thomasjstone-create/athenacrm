const apiBase = '/api';

async function fetchContacts() {
  const res = await fetch(`${apiBase}/contacts`);
  return res.json();
}

function renderContacts(list) {
  const container = document.getElementById('contactsList');
  container.innerHTML = '';
  if (!list.length) {
    container.innerHTML = '<div class="p-4 bg-slate-700 rounded">No contacts yet</div>';
    return;
  }
  list.forEach(c => {
    const el = document.createElement('div');
    el.className = 'p-3 bg-slate-700 rounded flex items-center justify-between';
    el.innerHTML = `
      <div>
        <div class="font-medium">${escapeHtml(c.name || '')}</div>
        <div class="text-sm text-slate-300">${escapeHtml(c.email || '')} • ${escapeHtml(c.company || '')} • ${escapeHtml(c.phone || '')}</div>
      </div>
      <div class="space-x-2">
        <button data-id="${c.id}" class="editBtn px-2 py-1 bg-indigo-600 rounded">Edit</button>
        <button data-id="${c.id}" class="delBtn px-2 py-1 bg-red-600 rounded">Delete</button>
      </div>
    `;
    container.appendChild(el);
  });
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function loadAndRender() {
  const list = await fetchContacts();
  renderContacts(list);
}

document.getElementById('refreshBtn').addEventListener('click', loadAndRender);

document.getElementById('showWebhookSection').addEventListener('click', () => {
  document.getElementById('webhookSection').classList.remove('hidden');
});

document.getElementById('hideWebhookSection').addEventListener('click', () => {
  document.getElementById('webhookSection').classList.add('hidden');
});

document.getElementById('addForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value,
    email: form.email.value,
    company: form.company.value,
    phone: form.phone.value
  };
  await fetch(`${apiBase}/contacts`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
  form.reset();
  loadAndRender();
});

// delegated delete/edit
document.getElementById('contactsList').addEventListener('click', async (e) => {
  const id = e.target.getAttribute('data-id');
  if (!id) return;
  if (e.target.classList.contains('delBtn')) {
    await fetch(`${apiBase}/contacts/${id}`, { method: 'DELETE' });
    loadAndRender();
  }
  if (e.target.classList.contains('editBtn')) {
    const newName = prompt('New name');
    if (newName == null) return;
    await fetch(`${apiBase}/contacts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName }) });
    loadAndRender();
  }
});

document.getElementById('webhookForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    contact: {
      fullName: form.fullName.value,
      email_address: form.email_address.value,
      company: form.company.value
    },
    secret: form.secret.value || undefined
  };
  const res = await fetch(`${apiBase}/webhook`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
  const status = document.getElementById('webhookStatus');
  if (res.ok) {
    status.textContent = 'Webhook sent successfully.';
    status.className = 'mt-4 text-emerald-400';
    form.reset();
    loadAndRender();
  } else {
    const body = await res.json().catch(() => ({}));
    status.textContent = `Webhook failed: ${body.error || res.statusText}`;
    status.className = 'mt-4 text-rose-400';
  }
});

document.getElementById('sendWebhookSample').addEventListener('click', async () => {
  const sample = { contact: { fullName: 'Webhook Person', email_address: 'webhook@example.com', company: 'Webhook Inc' } };
  const res = await fetch(`${apiBase}/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sample) });
  if (res.ok) {
    alert('Webhook sent and processed');
    loadAndRender();
  } else {
    alert('Webhook failed');
  }
});

// initial load
loadAndRender();
