// ====== Utilities & Storage Helpers ======
const LS_KEYS = {
  USERS: 'users',
  CURRENT_USER: 'currentUser',
  MEMBERS: 'members',
  PAYMENTS: 'payments',
  THEME: 'theme'
};

function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function writeLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function upsertArray(arr, index, item) {
  const copy = [...arr];
  if (index === null || index === undefined || index === '') copy.push(item);
  else copy[Number(index)] = item;
  return copy;
}
function removeAt(arr, index) {
  const copy = [...arr];
  copy.splice(Number(index), 1);
  return copy;
}
function sanitize(str) {
  return String(str ?? '').trim();
}

// ====== Auth Page Logic ======
(function initAuthPage() {
  const signInForm = document.getElementById('signInForm');
  const signUpForm = document.getElementById('signUpForm');
  if (!signInForm && !signUpForm) return; // Not on auth page

  const showSignInBtn = document.getElementById('showSignIn');
  const showSignUpBtn = document.getElementById('showSignUp');
  const toSignUp = document.getElementById('toSignUp');
  const toSignIn = document.getElementById('toSignIn');

  const siError = document.getElementById('si-error');
  const suError = document.getElementById('su-error');

  const showSignIn = () => {
    signInForm.classList.remove('hidden');
    signUpForm.classList.add('hidden');
    showSignInBtn.classList.add('active');
    showSignUpBtn.classList.remove('active');
  };
  const showSignUp = () => {
    signUpForm.classList.remove('hidden');
    signInForm.classList.add('hidden');
    showSignUpBtn.classList.add('active');
    showSignInBtn.classList.remove('active');
  };
  showSignInBtn?.addEventListener('click', showSignIn);
  showSignUpBtn?.addEventListener('click', showSignUp);
  toSignUp?.addEventListener('click', (e) => { e.preventDefault(); showSignUp(); });
  toSignIn?.addEventListener('click', (e) => { e.preventDefault(); showSignIn(); });

  // Sign Up handler
  signUpForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    suError.textContent = '';
    const username = sanitize(document.getElementById('su-username').value);
    const email = sanitize(document.getElementById('su-email').value).toLowerCase();
    const password = document.getElementById('su-password').value;
    const confirm = document.getElementById('su-confirm').value;
    const terms = document.getElementById('su-terms').checked;

    if (!username || !email || !password || !confirm) {
      suError.textContent = 'Please fill in all fields.';
      return;
    }
    if (password.length < 6) {
      suError.textContent = 'Password must be at least 6 characters.';
      return;
    }
    if (password !== confirm) {
      suError.textContent = 'Passwords do not match.';
      return;
    }
    if (!terms) {
      suError.textContent = 'You must agree to the Terms & Conditions.';
      return;
    }

    const users = readLS(LS_KEYS.USERS, []);
    const exists = users.some(u => u.username === username || u.email === email);
    if (exists) {
      suError.textContent = 'Username or email already exists.';
      return;
    }
    users.push({ username, email, password });
    writeLS(LS_KEYS.USERS, users);
    alert('Account created successfully! Please sign in.');
    showSignIn();
  });

  // Sign In handler
  signInForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    siError.textContent = '';
    const username = sanitize(document.getElementById('si-username').value);
    const email = sanitize(document.getElementById('si-email').value).toLowerCase();
    const password = document.getElementById('si-password').value;
    const remember = document.getElementById('si-remember').checked;

    if (!remember) {
      siError.textContent = 'Please check "Remember Me" to log in.';
      return;
    }
    if (!username || !email || !password) {
      siError.textContent = 'Please fill in all fields.';
      return;
    }
    const users = readLS(LS_KEYS.USERS, []);
    const found = users.find(u => u.username === username && u.email === email && u.password === password);
    if (!found) {
      siError.textContent = 'Invalid credentials.';
      return;
    }
    writeLS(LS_KEYS.CURRENT_USER, { username: found.username, email: found.email });
    window.location.href = 'dashboard.html';
  });
})();

// ====== App Page Logic ======
(function initAppPage() {
  const content = document.querySelector('.content');
  if (!content) return; // Not on app page

  // Redirect if not logged in
  const currentUser = readLS(LS_KEYS.CURRENT_USER, null);
  if (!currentUser) {
    alert('Please sign in first.');
    window.location.href = 'index.html';
    return;
  }

  // Theme
  const toggleTheme = document.getElementById('toggleTheme');
  const savedTheme = readLS(LS_KEYS.THEME, 'dark'); // default dark
  document.documentElement.dataset.theme = savedTheme;
  toggleTheme.checked = savedTheme === 'dark' ? true : false;
  applyTheme(savedTheme);
  toggleTheme.addEventListener('change', () => {
    const mode = toggleTheme.checked ? 'dark' : 'light';
    writeLS(LS_KEYS.THEME, mode);
    applyTheme(mode);
  });
  function applyTheme(mode) {
    const root = document.documentElement;
    if (mode === 'light') {
      root.style.setProperty('--bg', '#f8fafc');
      root.style.setProperty('--surface', '#ffffff');
      root.style.setProperty('--border', '#e5e7eb');
      root.style.setProperty('--text', '#0f172a');
      root.style.setProperty('--muted', '#475569');
      root.style.setProperty('--shadow', 'rgba(0,0,0,0.08)');
    } else {
      root.style.removeProperty('--bg'); // revert to CSS default (dark palette)
      root.style.removeProperty('--surface');
      root.style.removeProperty('--border');
      root.style.removeProperty('--text');
      root.style.removeProperty('--muted');
      root.style.removeProperty('--shadow');
    }
  }

  // Greeting
  const greeting = document.getElementById('greeting');
  greeting.textContent = `Welcome, ${currentUser.username}!`;

  // Stats
  const statMembers = document.getElementById('stat-members');
  const statPayments = document.getElementById('stat-payments');

  // Views
  const views = {
    dashboard: document.getElementById('view-dashboard'),
    members: document.getElementById('view-members'),
    payments: document.getElementById('view-payments')
  };
  const menuButtons = document.querySelectorAll('.menu-item');
  menuButtons.forEach(btn => btn.addEventListener('click', () => {
    menuButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const v = btn.dataset.view;
    Object.values(views).forEach(sec => sec.classList.remove('show'));
    views[v].classList.add('show');
  }));

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem(LS_KEYS.CURRENT_USER);
      window.location.href = 'index.html';
    }
  });

  // Members
  let members = readLS(LS_KEYS.MEMBERS, []);
  const membersList = document.getElementById('membersList');
  const memberSearch = document.getElementById('memberSearch');
  const memberSort = document.getElementById('memberSort');
  const addMemberBtn = document.getElementById('addMemberBtn');

  // Member modal
  const memberModal = document.getElementById('memberModal');
  const closeMemberModal = document.getElementById('closeMemberModal');
  const memberForm = document.getElementById('memberForm');
  const memberIndex = document.getElementById('memberIndex');
  const mName = document.getElementById('m-name');
  const mDob = document.getElementById('m-dob');
  const mDesc = document.getElementById('m-desc');
  const memberError = document.getElementById('memberError');
  const memberModalTitle = document.getElementById('memberModalTitle');

  function openMemberModal(editIndex = null) {
    memberError.textContent = '';
    if (editIndex !== null) {
      const m = members[editIndex];
      memberIndex.value = String(editIndex);
      mName.value = m.name;
      mDob.value = m.dob;
      mDesc.value = m.description;
      memberModalTitle.textContent = 'Edit Member';
    } else {
      memberIndex.value = '';
      memberForm.reset();
      memberModalTitle.textContent = 'Add Member';
    }
    memberModal.classList.remove('hidden');
  }
  function closeMember() { memberModal.classList.add('hidden'); }
  closeMemberModal.addEventListener('click', closeMember);
  memberModal.addEventListener('click', (e) => { if (e.target === memberModal) closeMember(); });

  addMemberBtn.addEventListener('click', () => openMemberModal(null));

  memberForm.addEventListener('submit', (e) => {
    e.preventDefault();
    memberError.textContent = '';
    const name = sanitize(mName.value);
    const dob = mDob.value;
    const description = sanitize(mDesc.value);

    if (!name || !dob || !description) { memberError.textContent = 'Please fill in all required fields.'; return; }

    const idx = memberIndex.value;
    const payload = { name, dob, description };
    members = upsertArray(members, idx, payload);
    writeLS(LS_KEYS.MEMBERS, members);
    renderMembers();
    updateStats();
    closeMember();
  });

  function renderMembers() {
    const q = sanitize(memberSearch.value).toLowerCase();
    const [key, dir] = memberSort.value.split('-'); // name / asc|desc
    let data = members.filter(m => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
    data.sort((a, b) => {
      const v = a.name.localeCompare(b.name);
      return dir === 'asc' ? v : -v;
    });
    if (!data.length) {
      membersList.innerHTML = '<p class="muted">No members found.</p>';
      return;
    }
    membersList.innerHTML = data.map((m, i) => {
      const realIndex = members.indexOf(m);
      return `
        <div class="item">
          <div class="meta">
            <div class="title">${m.name}</div>
            <div class="desc">${m.description}</div>
            <div class="desc">DOB: ${m.dob}</div>
          </div>
          <div class="actions">
            <button class="btn ghost" data-action="edit-member" data-index="${realIndex}">✏️ Edit</button>
            <button class="btn danger" data-action="delete-member" data-index="${realIndex}">🗑️ Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  membersList.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;
    const idx = Number(target.dataset.index);
    const action = target.dataset.action;
    if (action === 'edit-member') {
      if (confirm('Edit this member?')) openMemberModal(idx);
    } else if (action === 'delete-member') {
      if (confirm('Delete this member?')) {
        members = removeAt(members, idx);
        writeLS(LS_KEYS.MEMBERS, members);
        renderMembers();
        updateStats();
      }
    }
  });
  memberSearch.addEventListener('input', renderMembers);
  memberSort.addEventListener('change', renderMembers);

  // Payments
  let payments = readLS(LS_KEYS.PAYMENTS, []);
  const paymentsList = document.getElementById('paymentsList');
  const paymentSearch = document.getElementById('paymentSearch');
  const paymentSort = document.getElementById('paymentSort');
  const addPaymentBtn = document.getElementById('addPaymentBtn');

  // Payment modal
  const paymentModal = document.getElementById('paymentModal');
  const closePaymentModal = document.getElementById('closePaymentModal');
  const paymentForm = document.getElementById('paymentForm');
  const paymentIndex = document.getElementById('paymentIndex');
  const pName = document.getElementById('p-name');
  const pAmount = document.getElementById('p-amount');
  const pMethod = document.getElementById('p-method');
  const pDesc = document.getElementById('p-desc');
  const paymentError = document.getElementById('paymentError');
  const paymentModalTitle = document.getElementById('paymentModalTitle');

  function openPaymentModal(editIndex = null) {
    paymentError.textContent = '';
    if (editIndex !== null) {
      const p = payments[editIndex];
      paymentIndex.value = String(editIndex);
      pName.value = p.name;
      pAmount.value = p.amount;
      pMethod.value = p.method;
      pDesc.value = p.description || '';
      paymentModalTitle.textContent = 'Edit Payment';
    } else {
      paymentIndex.value = '';
      paymentForm.reset();
      paymentModalTitle.textContent = 'Add Payment';
    }
    paymentModal.classList.remove('hidden');
  }
  function closePayment() { paymentModal.classList.add('hidden'); }
  closePaymentModal.addEventListener('click', closePayment);
  paymentModal.addEventListener('click', (e) => { if (e.target === paymentModal) closePayment(); });

  addPaymentBtn.addEventListener('click', () => openPaymentModal(null));

  paymentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    paymentError.textContent = '';
    const name = sanitize(pName.value);
    const amount = Number(pAmount.value);
    const method = pMethod.value;
    const description = sanitize(pDesc.value);

    if (!name || !method || isNaN(amount)) {
      paymentError.textContent = 'Please fill in all required fields with valid values.';
      return;
    }
    if (amount < 0) {
      paymentError.textContent = 'Amount cannot be negative.';
      return;
    }

    const idx = paymentIndex.value;
    const payload = { name, amount, method, description };
    payments = upsertArray(payments, idx, payload);
    writeLS(LS_KEYS.PAYMENTS, payments);
    renderPayments();
    updateStats();
    closePayment();
  });

  function methodIcon(method) {
    if (method === 'Credit Card') return '💳';
    if (method === 'Bank Transfer') return '🏦';
    if (method === 'Mobile Money') return '📱';
    return '💰';
  }

  function renderPayments() {
    const q = sanitize(paymentSearch.value).toLowerCase();
    const [key, dir] = paymentSort.value.split('-'); // name/amount, asc/desc
    let data = payments.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    data.sort((a, b) => {
      if (key === 'name') {
        const v = a.name.localeCompare(b.name);
        return dir === 'asc' ? v : -v;
      } else {
        const v = (a.amount - b.amount);
        return dir === 'asc' ? v : -v;
      }
    });
    if (!data.length) {
      paymentsList.innerHTML = '<p class="muted">No payments found.</p>';
      return;
    }
    paymentsList.innerHTML = data.map((p) => {
      const realIndex = payments.indexOf(p);
      return `
        <div class="item">
          <div class="meta">
            <div class="title">${methodIcon(p.method)} ${p.name}</div>
            <div class="desc">${p.description || ''}</div>
            <div class="desc">Amount: ${Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} — Method: ${p.method}</div>
          </div>
          <div class="actions">
            <button class="btn ghost" data-action="edit-payment" data-index="${realIndex}">✏️ Edit</button>
            <button class="btn danger" data-action="delete-payment" data-index="${realIndex}">🗑️ Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  paymentsList.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;
    const idx = Number(target.dataset.index);
    const action = target.dataset.action;
    if (action === 'edit-payment') {
      if (confirm('Edit this payment?')) openPaymentModal(idx);
    } else if (action === 'delete-payment') {
      if (confirm('Delete this payment?')) {
        payments = removeAt(payments, idx);
        writeLS(LS_KEYS.PAYMENTS, payments);
        renderPayments();
        updateStats();
      }
    }
  });
  paymentSearch.addEventListener('input', renderPayments);
  paymentSort.addEventListener('change', renderPayments);

  // Stats refresh
  function updateStats() {
    statMembers.textContent = String(members.length);
    statPayments.textContent = String(payments.length);
  }

  // Initial render
  renderMembers();
  renderPayments();
  updateStats();
})();
