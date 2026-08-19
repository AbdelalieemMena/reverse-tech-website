document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const status = document.getElementById('contactStatus');
  const btn = document.getElementById('contactSubmit');
  const whatsappNumber = '201114578817';

  function buildWhatsAppUrl(payload, english) {
    const lines = english
      ? [
          'New contact request - Reverse Tech',
          `Name: ${payload.name || '-'}`,
          `Phone: ${payload.phone || '-'}`,
          `Email: ${payload.email || '-'}`,
          `Company: ${payload.company || '-'}`,
          `Service: ${payload.service || '-'}`,
          `Message: ${payload.message || '-'}`,
        ]
      : [
          'رسالة جديدة من موقع Reverse Tech',
          `الاسم: ${payload.name || '-'}`,
          `الهاتف: ${payload.phone || '-'}`,
          `البريد: ${payload.email || '-'}`,
          `الشركة: ${payload.company || '-'}`,
          `الخدمة: ${payload.service || '-'}`,
          `الرسالة: ${payload.message || '-'}`,
        ];
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const english = document.documentElement.lang === 'en';
    const originalLabel = btn.textContent;
    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone?.value.trim() || '',
      company: form.company?.value.trim() || '',
      service: form.service?.value.trim() || '',
      message: form.message.value.trim(),
    };

    // Open the final prepared WhatsApp message immediately during the user's click.
    // No blank waiting page and no dependency on email/Supabase response time.
    const whatsappUrl = buildWhatsAppUrl(payload, english);
    const whatsappWindow = window.open(whatsappUrl, '_blank', 'noopener');

    status.className = 'contact-status';
    status.replaceChildren();
    status.textContent = english ? 'Saving your message...' : 'جارٍ حفظ رسالتك...';
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = english ? 'Sending...' : 'جارٍ الإرسال...';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (_) {}
      if (!response.ok) throw new Error(data.error || (english ? 'Send failed' : 'فشل الإرسال'));

      status.classList.add('success');
      status.textContent = english
        ? 'Your message was received successfully. WhatsApp was opened separately.'
        : 'تم استلام رسالتك بنجاح، وتم فتح واتساب في نافذة منفصلة.';

      if (!whatsappWindow) {
        const link = document.createElement('a');
        link.href = whatsappUrl;
        link.target = '_blank';
        link.rel = 'noopener';
        link.className = 'contact-whatsapp-link';
        link.textContent = english ? 'Open WhatsApp' : 'فتح واتساب';
        status.append(document.createElement('br'), link);
      }
      form.reset();
    } catch (error) {
      console.error(error);
      status.classList.add('error');
      status.textContent = english
        ? `WhatsApp opened, but the website could not save the message: ${error.message}`
        : `تم فتح واتساب، لكن تعذر حفظ الرسالة في الموقع: ${error.message}`;
    } finally {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = originalLabel;
    }
  });
});
