import type { ChangeEvent } from 'react';
import styles from '../../RegistrationForm.module.scss';

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export function PasswordField({ value, onChange, disabled }: PasswordFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor="password">
        Пароль
      </label>
      <input
        id="password"
        name="password"
        type="password"
        className={styles.input}
        placeholder="Минимум 8 символов"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete="new-password"
        required
      />
      <span className={styles.hint}>Пароль должен содержать не менее 8 символов</span>
    </div>
  );
}
