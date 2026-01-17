document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('events-container');

  /* ---------- View Counter Module ---------- */
  const ViewCounter = (() => {
    const STORAGE_KEY = 'pixelphantoms_event_views';
    const DEBOUNCE_TIME = 3000; // 3 seconds

    // In-memory fallback storage and flag for localStorage availability
    let inMemoryViewData = {};
    let localStorageAvailable = true;

    // Get all view data from storage
    const getViewData = () => {
      // If we've already determined localStorage is unavailable, use in-memory store
      if (!localStorageAvailable) {
        return inMemoryViewData;
      }

      try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
      } catch (e) {
        console.warn('localStorage unavailable, using in-memory storage');
        localStorageAvailable = false;
        return inMemoryViewData;
      }
    };

    // Save view data to storage
    const saveViewData = (data) => {
      // If localStorage is known to be unavailable, persist only in memory
      if (!localStorageAvailable) {
        inMemoryViewData = data;
        return;
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn('Could not save to localStorage, falling back to in-memory storage');
        localStorageAvailable = false;
        inMemoryViewData = data;
      }
    };

    // Get view count for a specific event
    const getViewCount = (eventId) => {
      const data = getViewData();
      return data[eventId]?.count || 0;
    };

    // Check if this event was viewed recently (within debounce time)
    const isRecentView = (eventId) => {
      const data = getViewData();
      if (!data[eventId]?.lastView) return false;
      const timeSinceLastView = Date.now() - data[eventId].lastView;
      return timeSinceLastView < DEBOUNCE_TIME;
    };

    // Increment view count for an event
    const incrementViewCount = (eventId) => {
      // Prevent spam - check if recently viewed
      if (isRecentView(eventId)) {
        console.log(`Event ${eventId} was viewed recently, skipping increment`);
        return getViewCount(eventId);
      }

      const data = getViewData();
      
      if (!data[eventId]) {
        data[eventId] = { count: 0, lastView: null };
      }

      data[eventId].count += 1;
      data[eventId].lastView = Date.now();
      
      saveViewData(data);
      return data[eventId].count;
    };

    // Format view count for display (123 → "123", 1234 → "1.2K", 1234567 → "1.2M")
    const formatViewCount = (count) => {
      if (count < 1000) return `${count}`;
      if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
      return `${(count / 1000000).toFixed(1)}M`;
    };

    // Update the view count display in the UI
    const updateViewDisplay = (eventId, count) => {
      const viewElement = document.querySelector(`[data-view-for="${eventId}"]`);
      if (viewElement) {
        const formattedCount = formatViewCount(count);
        const usesAbbreviation = formattedCount.includes('K') || formattedCount.includes('M');
        const isPlural = usesAbbreviation || count !== 1;
        viewElement.textContent = `${formattedCount} view${isPlural ? 's' : ''}`;
        
        // Add pulse animation
        viewElement.parentElement.classList.add('view-pulse');
        setTimeout(() => {
          viewElement.parentElement.classList.remove('view-pulse');
        }, 500);
      }
    };

    return {
      getViewCount,
      incrementViewCount,
      formatViewCount,
      updateViewDisplay,
      isRecentView
    };
  })();

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

      /* ---------- Render Event Cards ---------- */
      allEvents.forEach((event, index) => {
        const hasValidRegistration =
          event.registrationOpen && event.registrationLink && event.registrationLink.trim() !== '';

        const eventDate = normalizeDate(event.date);
        const card = document.createElement('div');
        card.className = 'event-card';


        let computedStatus = 'Upcoming';
        if (eventDate < today) computedStatus = 'Ended';
        else if (eventDate.getTime() === today.getTime()) computedStatus = 'Today';

        const statusClass = computedStatus.toLowerCase();

        // Generate unique event ID
       
        

        // Generate unique, stable event ID based on event data
        const eventIdBase = `${event.title || 'Untitled Event'}|${event.date}`;
        const eventId = `event-${encodeURIComponent(eventIdBase)}`;
        const viewCount = ViewCounter.getViewCount(eventId);
        const formattedViews = ViewCounter.formatViewCount(viewCount);
        card.setAttribute('tabindex', '0');
        card.setAttribute('data-event-id', eventId);

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

          <div class="event-footer">
            <div class="event-register">
              ${
                hasValidRegistration && eventDate >= today
                  ? `<a href="${event.registrationLink}" target="_blank" 
                       class="btn-register btn-open-register"
                       aria-label="Register for ${event.title || 'Event'}"
                       data-event-title="${(event.title || 'Event').replace(/"/g, '&quot;')}">
                       Register Now
                     </a>`
                  : `<button class="btn-register disabled" disabled aria-disabled="true">
                       Registration Closed
                     </button>`
              }
            </div>
            <div class="event-views">
              <span class="view-icon">👁️</span>
              <span class="view-count" data-view-for="${eventId}">${formattedViews} view${viewCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        `;

        // Add click event listener to increment view count
        card.addEventListener('click', () => {
          const newCount = ViewCounter.incrementViewCount(eventId);
          ViewCounter.updateViewDisplay(eventId, newCount);
        });

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

    // Add input validation feedback
    const inputs = registerForm?.querySelectorAll('input');
    inputs?.forEach(input => {
      const validate = () => {
        if (input.value.trim() !== '') {
          if (input.checkValidity()) {
            input.classList.remove('invalid');
            input.classList.add('valid');
          } else {
            input.classList.remove('valid');
            input.classList.add('invalid');
          }
        } else {
          input.classList.remove('valid', 'invalid');
        }
      };

      input.addEventListener('input', validate);
      input.addEventListener('blur', validate);
      
      input.addEventListener('invalid', (e) => {
        e.preventDefault();
        input.classList.add('invalid');
      });
    });

    registerForm?.addEventListener('submit', e => {
      e.preventDefault();

      const inputs = registerForm?.querySelectorAll('input');
      let isValid = true;
      inputs?.forEach(input => {
        if (!input.checkValidity()) {
          input.classList.add('invalid');
          isValid = false;
        } else {
          input.classList.add('valid');
        }
      });

      if (!isValid) return;

      alert('Successfully registered!');
      registerForm.reset();
      inputs?.forEach(input => input.classList.remove('valid', 'invalid'));
      closeModal();
      
    });
  })();
});

    
