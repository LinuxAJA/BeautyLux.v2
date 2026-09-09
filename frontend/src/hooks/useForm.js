import { useCallback, useMemo, useRef, useState } from 'react';

/**
 * Motor de formularios con validación en tiempo real.
 *
 * @param {Object} initialValues  Valores iniciales de cada campo.
 * @param {Object|Function} schema  Reglas por campo. Puede ser una función
 *        `(values) => reglas` cuando una regla depende de otro campo
 *        (por ejemplo, el número de documento depende del tipo).
 *
 * Comportamiento:
 * - `handleChange` sanitiza el valor y revalida al instante → el error aparece
 *   y desaparece mientras el usuario escribe.
 * - El error solo se MUESTRA cuando el campo fue tocado (blur) o tras un
 *   intento de envío, para no marcar en rojo desde la primera tecla.
 * - `handleSubmit` revalida todo el formulario antes de procesar los datos.
 */
export function useForm(initialValues, schema) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const initialValuesRef = useRef(initialValues);

  const resolveSchema = useCallback(
    (currentValues) => (typeof schema === 'function' ? schema(currentValues) : schema),
    [schema],
  );

  /** Valida un único campo y devuelve el mensaje de error o `null`. */
  const validateField = useCallback(
    (name, value, currentValues) => {
      const rules = resolveSchema(currentValues)[name];
      if (!rules) return null;

      const messages = rules.messages ?? {};
      const text = typeof value === 'string' ? value.trim() : value;

      if (rules.required && (text === '' || text === null || text === undefined || text === false)) {
        return messages.required ?? 'Este campo es obligatorio.';
      }

      // Los campos opcionales vacíos no siguen validándose.
      if (text === '' || text === null || text === undefined) return null;

      if (rules.minLength && String(text).length < rules.minLength) {
        return (
          messages.minLength ??
          `Debe tener al menos ${rules.minLength} caracteres.`
        );
      }

      if (rules.maxLength && String(text).length > rules.maxLength) {
        return (
          messages.maxLength ??
          `No puede superar los ${rules.maxLength} caracteres.`
        );
      }

      if (rules.pattern && !rules.pattern.test(String(text))) {
        return messages.pattern ?? 'El formato no es válido.';
      }

      if (rules.match && currentValues[rules.match] !== value) {
        return messages.match ?? 'Los valores no coinciden.';
      }

      if (typeof rules.validate === 'function') {
        const customError = rules.validate(value, currentValues);
        if (customError) return customError;
      }

      return null;
    },
    [resolveSchema],
  );

  /** Valida todos los campos declarados en el esquema. */
  const validateAll = useCallback(
    (currentValues) => {
      const rules = resolveSchema(currentValues);
      const nextErrors = {};

      for (const name of Object.keys(rules)) {
        const error = validateField(name, currentValues[name], currentValues);
        if (error) nextErrors[name] = error;
      }

      return nextErrors;
    },
    [resolveSchema, validateField],
  );

  // Los errores se derivan siempre de los valores actuales: no hay estado duplicado.
  const errors = useMemo(() => validateAll(values), [values, validateAll]);
  const isValid = Object.keys(errors).length === 0;

  /** Errores que deben pintarse en pantalla ahora mismo. */
  const visibleErrors = useMemo(() => {
    const result = {};
    for (const [name, message] of Object.entries(errors)) {
      if (submitAttempted || touched[name]) result[name] = message;
    }
    return result;
  }, [errors, touched, submitAttempted]);

  const setFieldValue = useCallback(
    (name, rawValue) => {
      setValues((previous) => {
        const rules = resolveSchema(previous)[name];
        let value = rawValue;

        if (typeof value === 'string' && rules) {
          if (typeof rules.sanitize === 'function') value = rules.sanitize(value);
          // Limita la cantidad de caracteres que el usuario puede ingresar.
          if (rules.maxLength) value = value.slice(0, rules.maxLength);
        }

        return { ...previous, [name]: value };
      });
    },
    [resolveSchema],
  );

  const handleChange = useCallback(
    (event) => {
      const { name, type, value, checked } = event.target;
      setFieldValue(name, type === 'checkbox' ? checked : value);
    },
    [setFieldValue],
  );

  const handleBlur = useCallback((event) => {
    const { name } = event.target;
    setTouched((previous) => ({ ...previous, [name]: true }));
  }, []);

  const reset = useCallback((nextValues) => {
    setValues(nextValues ?? initialValuesRef.current);
    setTouched({});
    setSubmitAttempted(false);
    setIsSubmitting(false);
  }, []);

  /**
   * Envuelve el envío: marca todo como tocado, revalida y solo entonces
   * ejecuta `onValid(values)`. Acepta callbacks síncronos o asíncronos.
   */
  const handleSubmit = useCallback(
    (onValid) => async (event) => {
      event?.preventDefault?.();
      setSubmitAttempted(true);

      const currentErrors = validateAll(values);
      const allTouched = Object.fromEntries(
        Object.keys(resolveSchema(values)).map((name) => [name, true]),
      );
      setTouched(allTouched);

      if (Object.keys(currentErrors).length > 0) return;

      try {
        setIsSubmitting(true);
        await onValid(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateAll, resolveSchema],
  );

  /** Props listas para pasar a <Input> / <Select> y evitar repetición en el JSX. */
  const getFieldProps = useCallback(
    (name) => {
      const rules = resolveSchema(values)[name] ?? {};
      return {
        name,
        value: values[name] ?? '',
        onChange: handleChange,
        onBlur: handleBlur,
        error: visibleErrors[name],
        isValid: Boolean(touched[name]) && !errors[name] && values[name] !== '',
        maxLength: rules.maxLength,
        required: Boolean(rules.required),
      };
    },
    [values, visibleErrors, errors, touched, handleChange, handleBlur, resolveSchema],
  );

  return {
    values,
    errors: visibleErrors,
    allErrors: errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    getFieldProps,
    reset,
  };
}

export default useForm;
