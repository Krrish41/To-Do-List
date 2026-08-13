import React, { useRef } from 'react';
import { useTodoStore } from '../store/store';

// === Apple Design Implementation ===
const AddTaskForm = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      onAdd?.call(this, { title: e.currentTarget.value.trim() });
      e.currentTarget.value = '';
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '1rem',
      marginBottom: '1rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      borderRadius: '12px',
      background: 'rgba(255, 255, 255, 0.85)',
      padding: '0.5rem 1rem'
    }}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Add a task... (Press Enter)"
        onKeyDown={handleKeyDown}
        style={{
          height: '40px',
          fontSize: '14px',
          border: '1px solid #A855F7',
          borderRadius: '8px',
          padding: '8px 12px',
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#1D1D1F',
          selectionColor: '#A855F7'
        }}
      />

      <button
        onClick={() => {
          const input = inputRef.current;
          if (input?.value.trim()) {
            onAdd?.call(this, { title: input.value.trim() });
            input.value = '';
          }
        }}
        style={{
          padding: '0 12px',
          height: '40px',
          background: '#A855F7',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        + Add
      </button>
    </div>
  );
};

export default AddTaskForm;