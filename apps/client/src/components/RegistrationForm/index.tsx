import { useState, type FormEvent } from 'react';
import { registerUser, ApiError, type RegisterResponse } from '../../api/authApi';
import { FormAlert } from './components/FormAlert';
import { EmailField } from './components/EmailField';
import { PasswordField } from './components/PasswordField';
import { SubmitButton } from './components/SubmitButton';
import styles from './RegistrationForm.module.scss';

interface RegistrationFormProps {
  onSuccess: (response: RegisterResponse) => void;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await registerUser({ email, password });
      onSuccess(response);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Что-то пошло не так. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {error && <FormAlert message={error} />}
      <EmailField value={email} onChange={setEmail} disabled={isSubmitting} />
      <PasswordField value={password} onChange={setPassword} disabled={isSubmitting} />
      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}
