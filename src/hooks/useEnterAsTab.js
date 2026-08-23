import { useEffect, useRef } from 'react';

/**
 * useEnterAsTab Hook
 * Makes Enter key advance to next field like Tab, submit on last field
 */
export const useEnterAsTab = ({ onSubmit, excludeSearch = false } = {}) => {
  const formRef = useRef(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const handleKeyDown = (e) => {
      if (e.key !== 'Enter') return;

      const target = e.target;

      // Skip textareas (preserve line breaks)
      if (target.tagName === 'TEXTAREA') return;

      // Skip buttons and submit inputs
      if (target.type === 'submit' || target.tagName === 'BUTTON') return;

      // Skip search inputs if excludeSearch enabled
      if (excludeSearch && (
        target.type === 'search' ||
        target.getAttribute('role') === 'searchbox' ||
        target.id?.includes('search') ||
        target.placeholder?.toLowerCase().includes('search')
      )) {
        return;
      }

      // Only handle INPUT and SELECT
      if (target.tagName !== 'INPUT' && target.tagName !== 'SELECT') return;

      e.preventDefault();

      const inputs = Array.from(
        form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select')
      ).filter(el => {
        // Only visible, enabled elements
        if (el.offsetParent === null || el.disabled) return false;
        // Skip textareas
        if (el.tagName === 'TEXTAREA') return false;
        // Skip search inputs if excludeSearch
        if (excludeSearch && (
          el.type === 'search' ||
          el.getAttribute('role') === 'searchbox' ||
          el.id?.includes('search')
        )) {
          return false;
        }
        return true;
      });

      const currentIndex = inputs.indexOf(target);
      if (currentIndex === -1) return;

      const nextInput = inputs[currentIndex + 1];

      if (nextInput) {
        // Move to next field
        nextInput.focus();
        if (nextInput.tagName === 'SELECT') {
          nextInput.click();
        }
      } else {
        // Last field - trigger submit
        if (onSubmit) {
          onSubmit(e);
        } else {
          form.requestSubmit();
        }
      }
    };

    form.addEventListener('keydown', handleKeyDown);
    return () => form.removeEventListener('keydown', handleKeyDown);
  }, [onSubmit, excludeSearch]);

  return formRef;
};

export default useEnterAsTab;
