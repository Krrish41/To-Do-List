import React, { useState } from 'react';
import { Check } from 'lucide-react';
import type { Task } from '../store/store';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleClick = () => {
    onToggle(task.id);
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // In a real app, you would find the dragged item and reorder
    console.log('Dropped item:', e.dataTransfer.getData('text/plain'));
  };

  return (
    <div
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragEnd}
      draggable
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '1rem',
        background: 'var(--card-light)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--glass-border)',
        borderRadius: '10px',
        transition: 'all 0.2s ease',
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        onMouseEnter={(e) => {
          if (!task.completed) {
            e.currentTarget.style.borderColor = 'rgb(var(--color-primary))';
            e.currentTarget.style.background = 'rgba(var(--color-primary), 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!task.completed) {
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.background = 'transparent';
          }
        }}
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          border: task.completed ? '2px solid transparent' : '2px solid var(--glass-border)',
          background: task.completed ? 'var(--glass-bg)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0,
        }}
      >
        <div style={{ 
          transform: task.completed ? 'scale(1)' : 'scale(0)', 
          opacity: task.completed ? 0.6 : 0, 
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex',
        }}>
          <Check size={16} color="rgb(var(--color-text-muted))" strokeWidth={3} />
        </div>
      </button>
      <span
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: task.completed ? 'rgb(var(--color-text-muted))' : 'rgb(var(--color-text-primary))',
          fontWeight: task.completed ? 400 : 500,
          fontSize: '1.05rem',
          transition: 'all 0.3s ease',
        }}
      >
        <span style={{ position: 'relative', display: 'inline-block' }}>
          {task.title}
          <span style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            height: '2px',
            background: 'currentColor',
            width: task.completed ? '100%' : '0%',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: task.completed ? 0.6 : 0,
          }} />
        </span>
        {task.priority === 'high' && (
          <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px', fontWeight: 600 }}>
            High Priority
          </span>
        )}
        {task.dueDate && new Date(task.dueDate) < new Date() && (
          <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', borderRadius: '4px', fontWeight: 600 }}>
            Overdue
          </span>
        )}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ef4444';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgb(var(--color-text-muted))';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgb(var(--color-text-muted))',
          fontSize: '1.2rem',
          cursor: 'pointer',
          padding: '0.25rem',
          transition: 'all 0.2s ease',
        }}
      >
        ✕
      </button>
    </div>
  );
};

export default TaskItem;
