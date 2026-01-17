document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('events-container');

  /* ---------- Helpers ---------- */
  const formatDate = dateStr => {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const normalizeDate = dateStr => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  /* ---------- Fetch Events ---------- */
  fetch('data/events.json')
    .then(res => res.json())
    .then(events => {
      if (!Array.isArray(events) || events.length === 0) {
        container.innerHTML = `
          <div class="no-events">
            <h3>No upcoming events</h3>
            <p>Please check back later or propose a new event.</p>
          </div>
        `;
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingEvents = events
        .filter(e => normalizeDate(e.date) >= today)
        .sort((a, b) => normalizeDate(a.date) - normalizeDate(b.date));

      const pastEvents = events
        .filter(e => normalizeDate(e.date) < today)
        .sort((a, b) => normalizeDate(b.date) - normalizeDate(a.date));

      if (upcomingEvents.length > 0 && typeof startCountdown === 'function') {
        startCountdown(upcomingEvents[0]);
      }

      container.innerHTML = '';
      const allEvents = [...upcomingEvents, ...pastEvents];

      allEvents.forEach(event => {
        const hasValidRegistration =
          event.registrationOpen && event.registrationLink && event.registrationLink.trim() !== '';

        const eventDate = normalizeDate(event.date);

        let computedStatus = 'Upcoming';
        if (eventDate < today) computedStatus = 'Ended';
        else if (eventDate.getTime() === today.getTime()) computedStatus = 'Today';

        const statusClass = computedStatus.toLowerCase();

        const card = document.createElement('article');
        card.className = `event-card ${statusClass}`;
        card.setAttribute('tabindex', '0');

        card.innerHTML = `
          <div class="event-card-header">
            <h3 class="event-title">${event.title || 'Untitled Event'}</h3>
            <span class="event-status ${statusClass}">
              ${computedStatus}
            </span>
          </div>

          <div class="event-meta">
            <div class="meta-item">
              <i class="fa-solid fa-calendar-days"></i>
              <span>${formatDate(event.date)}</span>
            </div>
            <div class="meta-item">
              <i class="fa-solid fa-location-dot"></i>
              <span>${event.location || 'To be announced'}</span>
            </div>
          </div>

          <p class="event-description">
            ${event.description || 'Event details will be updated soon.'}
          </p>

          <div class="event-register">
            ${hasValidRegistration && eventDate >= today
            ? `<a href="${event.registrationLink}" target="_blank"
                     class="btn-register btn-open-register"
                     data-event-title="${(event.title || 'Event').replace(/"/g, '&quot;')}">
                     Register Now
                   </a>`
            : `<button class="btn-register disabled" disabled>
                     Registration Closed
                   </button>`
          }
          </div>
        `;

        container.appendChild(card);
      });
    });

  /* ---------- Registration Modal Logic ---------- */
  (() => {
    const modal = document.getElementById('register-modal');
    const modalTitle = document.getElementById('register-event-title');
    const registerForm = document.getElementById('register-form');
    const closeBtn = modal?.querySelector('.modal-close');
    const cancelBtn = modal?.querySelector('.modal-cancel');

    const openModal = title => {
      modalTitle.textContent = title || 'Event';
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    document.addEventListener('click', e => {
      const btn = e.target.closest('.btn-open-register');
      if (btn) {
        e.preventDefault();
        openModal(btn.dataset.eventTitle);
      }
    });

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    modal?.addEventListener('click', e => {
      if (e.target === modal) closeModal();
    });

    /* 🔐 VALIDATION ADDED HERE */
    /* 🚀 ASYNC API REGISTRATION */
    const showToast = (message) => {
      let toast = document.getElementById('toast-notification');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 4000);
    };

    registerForm?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const firstName = registerForm.firstName.value.trim();
      const lastName = registerForm.lastName.value.trim();
      const age = parseInt(registerForm.age.value, 10);
      const email = registerForm.email.value.trim();
      const eventTitle = modalTitle.textContent;

      const nameRegex = /^[A-Z][a-z]{1,29}$/;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      console.log('Submitting form...', { firstName, lastName, age, email });

      // RELAXED VALIDATION FOR DEBUGGING
      // if (!nameRegex.test(firstName)) {
      //   showToast('First name: CamelCase alphabets only (e.g. "John").');
      //   return;
      // }

      // if (!nameRegex.test(lastName)) {
      //   showToast('Last name: CamelCase alphabets only (e.g. "Doe").');
      //   return;
      // }

      if (isNaN(age) || age < 18) {
        showToast('You must be at least 18 years old.');
        return;
      }

      if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address.');
        return;
      }

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Processing...';
      submitBtn.classList.add('btn-loading');
      submitBtn.disabled = true;

      console.log('🚀 Initiating fetch to http://127.0.0.1:5000/api/v1/register ...');
      try {
        // Use 127.0.0.1 to avoid Windows localhost IPv6 resolution issues
        const response = await fetch('http://127.0.0.1:5000/api/v1/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, lastName, age, email, eventTitle })
        });
        console.log('✅ Fetch response received:', response.status);


        const result = await response.json();

        if (response.ok) {
          showToast('Registration Successful! Check your email. ✅');
          registerForm.reset();
          setTimeout(closeModal, 1500);
        } else {
          showToast(result.message || (result.errors?.[0]?.msg) || 'Registration failed ❌');
        }
      } catch (error) {
        console.error('Registration error:', error);
        alert('❌ CONNECTION ERROR:\nCould not reach the backend server at http://localhost:5000.\n\nMake sure the backend terminal is running!');
        showToast('Server error. Please try again later. 🛠️');
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
      }
    });
  })();
});
