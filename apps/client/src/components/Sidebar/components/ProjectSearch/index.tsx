import type { ChangeEvent } from 'react';
import styles from './ProjectSearch.module.scss';

interface ProjectSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProjectSearch({ value, onChange }: ProjectSearchProps) {
  return (
    <input
      className={styles.input}
      type="search"
      placeholder="Поиск проектов"
      aria-label="Поиск проектов"
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
    />
  );
}
