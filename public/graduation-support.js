document.addEventListener('DOMContentLoaded', () => {
  const modalOverlay = document.getElementById('graduationSupportModal');
  const openButton = document.querySelector('[data-action="open-graduation-form"]');
  const closeButton = modalOverlay?.querySelector('.modal-close');
  const form = document.getElementById('graduationSupportForm');
  const formStatus = document.getElementById('graduationSupportFormStatus');
  const statusLabel = document.querySelector('.graduation-support-status');
  const submitBtn = form?.querySelector('.submit-btn');

  function toggleEngineeringProjectsDetails() {
    const engineeringProjectsSelect = form?.querySelector('#engineeringProjects');
    const details = document.getElementById('engineeringProjectsDetails');
    if (!engineeringProjectsSelect || !details) return;
    const show = engineeringProjectsSelect.value === 'نعم';
    details.style.display = show ? 'flex' : 'none';
    if (!show) {
      const fields = details.querySelectorAll('textarea, input');
      fields.forEach((field) => {
        if (field.type === 'file') {
          field.value = '';
        } else {
          field.value = '';
        }
      });
    }
  }

  async function fetchStatus() {
    try {
      const res = await fetch('/api/graduation-support/status', { cache: 'no-store' });
      if (!res.ok) throw new Error('تعذر الحصول على حالة التسجيل');
      const data = await res.json();
      const open = Boolean(data.open);
      const message = document.documentElement.lang === 'en' ? data.config.closed_message_en : data.config.closed_message_ar;
      if (statusLabel) {
        statusLabel.textContent = open
          ? (document.documentElement.lang === 'en' ? 'Open for applications' : 'التسجيل مفتوح')
          : message;
        if (!open) {
          statusLabel.classList.add('closed');
          openButton?.setAttribute('disabled', '');
        } else {
          statusLabel.classList.remove('closed');
          openButton?.removeAttribute('disabled');
        }
      }
    } catch (error) {
      if (statusLabel) statusLabel.textContent = document.documentElement.lang === 'en' ? 'Unable to load status' : 'تعذر تحميل حالة التسجيل';
    }
  }

  function openModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('hidden');
    modalOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.add('hidden');
    modalOverlay.setAttribute('aria-hidden', 'true');
  }

  if (openButton) {
    openButton.addEventListener('click', () => {
      if (openButton.hasAttribute('disabled')) return;
      openModal();
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', closeModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (event) => {
      if (event.target === modalOverlay) closeModal();
    });
  }

  if (form) {
    const engineeringProjectsSelect = form.querySelector('#engineeringProjects');
    engineeringProjectsSelect?.addEventListener('change', toggleEngineeringProjectsDetails);
    toggleEngineeringProjectsDetails();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submitBtn) return;
      submitBtn.disabled = true;
      submitBtn.textContent = document.documentElement.lang === 'en' ? 'Submitting...' : 'جاري الإرسال...';
      formStatus.textContent = '';
      const members = [];
      for (let i = 1; i <= 3; i += 1) {
        const nameField = document.getElementById(`member${i}Name`);
        const phoneField = document.getElementById(`member${i}Phone`);
        if (nameField && nameField.value.trim()) {
          members.push({ name: nameField.value.trim(), phone: phoneField?.value.trim() || '' });
        }
      }
      const engineeringProjectsValue = document.getElementById('engineeringProjects')?.value;
      const engineeringProjectsNames = document.getElementById('engineeringProjectsNames')?.value.trim() || '';
      const engineeringProjectsDescription = document.getElementById('engineeringProjectsDescription')?.value.trim() || '';
      const engineeringProjectImages = document.getElementById('engineeringProjectImages')?.files || [];
      const hasEngineeringProjectsData = Boolean(engineeringProjectsNames || engineeringProjectsDescription || engineeringProjectImages.length);
      if (engineeringProjectsValue === 'نعم' && hasEngineeringProjectsData && (!engineeringProjectsDescription || engineeringProjectImages.length === 0)) {
        formStatus.textContent = document.documentElement.lang === 'en'
          ? 'If you have engineering projects, please add a description and at least one image.'
          : 'إذا كان لديك مشاريع هندسية، يرجى إضافة وصف وصورة واحدة على الأقل.';
        formStatus.className = 'contact-status error';
        submitBtn.disabled = false;
        submitBtn.textContent = document.documentElement.lang === 'en' ? 'Submit Request' : 'إرسال الطلب';
        return;
      }
      const formData = new FormData(form);
      formData.set('team_members', JSON.stringify(members));
      formData.set('language', document.documentElement.lang === 'en' ? 'en' : 'ar');
      try {
        const response = await fetch('/api/graduation-support/requests', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'حدث خطأ');
        if (result.whatsapp_url) {
          window.open(result.whatsapp_url, '_blank', 'noopener,noreferrer');
        }
        formStatus.textContent = document.documentElement.lang === 'en' ? 'Your request has been submitted successfully.' : 'تم إرسال الطلب بنجاح.';
        formStatus.className = 'contact-status success';
        form.reset();
        closeModal();
      } catch (error) {
        formStatus.textContent = error.message || (document.documentElement.lang === 'en' ? 'Submission failed' : 'فشل الإرسال');
        formStatus.className = 'contact-status error';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = document.documentElement.lang === 'en' ? 'Submit Request' : 'إرسال الطلب';
      }
    });
  }

  document.addEventListener('reverseTechLanguageChanged', fetchStatus);
  fetchStatus();
});
