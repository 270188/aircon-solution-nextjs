import { useState } from 'react';

export const PHONE = /^\+?[0-9 ()-]{7,20}$/;
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Validator<T> = (values: T) => Partial<Record<keyof T, string>>;

/**
 * Formulario simple con validación por campo: los errores se muestran cuando el campo
 * fue tocado o cuando se intenta enviar (igual que el formulario reactivo anterior).
 */
export function useForm<T extends Record<string, string | boolean>>(initial: T, validate: Validator<T>) {
  const [values, setValues] = useState<T>(initial);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const errors = validate(values);

  return {
    values,
    errors,
    setServerErrors,
    isValid: Object.values(errors).every((e) => !e),
    set<K extends keyof T>(name: K, value: T[K]) {
      setValues((v) => ({ ...v, [name]: value }));
      setServerErrors((s) => {
        if (!s[name as string]) return s;
        const copy = { ...s };
        delete copy[name as string];
        return copy;
      });
    },
    touch(name: keyof T) {
      setTouched((t) => ({ ...t, [name]: true }));
    },
    touchAll() {
      setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])) as Partial<Record<keyof T, boolean>>);
    },
    reset() {
      setValues(initial);
      setTouched({});
      setServerErrors({});
    },
    /** Mensaje de error visible para un campo (vacío si no hay que mostrar nada). */
    error(name: keyof T): string {
      return serverErrors[name as string] ?? (touched[name] ? errors[name] ?? '' : '');
    },
  };
}
