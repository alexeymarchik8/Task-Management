import type { ChangeEvent } from 'react';
import styles from '../../RegistrationForm.module.scss';

interface EmailFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export function EmailField({ value, onChange, disabled }: EmailFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor="email">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        className={styles.input}
        placeholder="you@example.com"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete="email"
        required
      />
    </div>
  );
}
