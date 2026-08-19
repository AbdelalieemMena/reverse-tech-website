document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.subscribe-form').forEach((form) => {
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button[type="submit"]');
    if (!input || !button) return;

    let message = form.querySelector('.newsletter-status');
    if (!message) {
      message = document.createElement('div');
      message.className = 'newsletter-status';
      message.setAttribute('role', 'status');
      form.insertAdjacentElement('afterend', message);
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = input.value.trim();
      const english = document.documentElement.lang === 'en';
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        message.textContent = english ? 'Please enter a valid email.' : 'من فضلك أدخل بريدًا إلكترونيًا صحيحًا.';
        message.className = 'newsletter-status error';
        return;
      }

      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      message.textContent = english ? 'Sending...' : 'جارٍ الإرسال...';
      message.className = 'newsletter-status';

      try {
        const response = await fetch('/api/newsletter-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const text = await response.text();
        let data = {};
        try { data = text ? JSON.parse(text) : {}; } catch (_) {}
        if (!response.ok) throw new Error(data.error || (english ? 'Subscription failed' : 'تعذر إرسال الطلب'));
        message.textContent = english
          ? 'Your request reached Reverse Tech. A confirmation email was sent to you.'
          : 'وصل طلبك إلى Reverse Tech، وتم إرسال رسالة تأكيد إلى بريدك.';
        message.className = 'newsletter-status success';
        form.reset();
      } catch (error) {
        message.textContent = error.message || (english ? 'Subscription failed.' : 'تعذر إرسال الطلب.');
        message.className = 'newsletter-status error';
      } finally {
        button.disabled = false;
        button.removeAttribute('aria-busy');
      }
    });
  });
});
