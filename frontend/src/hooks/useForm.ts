// frontend/src/hooks/useForm.ts
"use client";

import { useState, useCallback, ChangeEvent, FormEvent } from "react";
import { validateForm } from "@/utils/validation";
import { z } from "zod";

type FieldValues = Record<string, any>;
type ValidationSchema<T extends FieldValues> = z.ZodType<T>;
type ErrorRecord<T> = Partial<Record<keyof T, string>>;
type TouchedRecord<T> = Partial<Record<keyof T, boolean>>;

interface UseFormOptions<T extends FieldValues> {
  initialValues: T;
  validationSchema?: ValidationSchema<T>;
  onSubmit: (values: T, helpers: FormHelpers<T>) => void | Promise<void>;
}

interface FormHelpers<T extends FieldValues> {
  setSubmitting: (isSubmitting: boolean) => void;
  resetForm: () => void;
  setValues: (values: Partial<T>) => void;
  setErrors: (errors: ErrorRecord<T>) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, isTouched?: boolean) => void;
}

interface UseFormReturn<T extends FieldValues> {
  values: T;
  errors: ErrorRecord<T>;
  touched: TouchedRecord<T>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  handleChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  handleBlur: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, isTouched?: boolean) => void;
  resetForm: () => void;
  setValues: (values: Partial<T>) => void;
  setErrors: (errors: ErrorRecord<T>) => void;
  validateField: (field: keyof T) => Promise<string | undefined>;
  validateForm: () => Promise<boolean>;
  getFieldProps: (field: keyof T) => {
    name: keyof T;
    value: any;
    onChange: (
      e: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => void;
    onBlur: (
      e: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => void;
    error: string | undefined;
    touched: boolean | undefined;
  };
}

export function useForm<T extends FieldValues>({
  initialValues,
  validationSchema,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ErrorRecord<T>>({});
  const [touched, setTouched] = useState<TouchedRecord<T>>({});
  const [isSubmitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitting(false);
    setIsDirty(false);
  }, [initialValues]);

  // Update form values
  const handleSetValues = useCallback(
    (newValues: Partial<T>) => {
      setValues((prev) => {
        const updated = { ...prev, ...newValues };
        setIsDirty(JSON.stringify(updated) !== JSON.stringify(initialValues));
        return updated;
      });
    },
    [initialValues],
  );

  // Set a specific field value
  const setFieldValue = useCallback(
    (field: keyof T, value: any) => {
      setValues((prev) => {
        const updated = { ...prev, [field]: value };
        setIsDirty(JSON.stringify(updated) !== JSON.stringify(initialValues));
        return updated;
      });
    },
    [initialValues],
  );

  // Set a specific field error
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  // Set a specific field as touched
  const setFieldTouched = useCallback(
    (field: keyof T, isTouched: boolean = true) => {
      setTouched((prev) => ({ ...prev, [field]: isTouched }));
    },
    [],
  );

  // Validate a specific field
  const validateField = useCallback(
    async (field: keyof T): Promise<string | undefined> => {
      if (!validationSchema) return undefined;

      try {
        // Create a schema just for this field
        const fieldSchema = z.object({
          [field]: validationSchema.shape[field],
        } as any);

        // Validate just this field
        await fieldSchema.parseAsync({ [field]: values[field] });

        // Remove error if validation passes
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });

        return undefined;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.errors.find((err) => err.path[0] === field);
          if (fieldError) {
            const errorMessage = fieldError.message;
            setFieldError(field, errorMessage);
            return errorMessage;
          }
        }
        return undefined;
      }
    },
    [validationSchema, values, setFieldError],
  );

  // Validate the entire form
  const validateFormValues = useCallback(async (): Promise<boolean> => {
    if (!validationSchema) return true;

    try {
      await validationSchema.parseAsync(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: ErrorRecord<T> = {};

        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            const field = err.path[0] as keyof T;
            newErrors[field] = err.message;
          }
        });

        setErrors(newErrors);
      }
      return false;
    }
  }, [validationSchema, values]);

  // Handle input change
  const handleChange = useCallback(
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value, type } = e.target;

      // Handle different input types
      let parsedValue: any = value;

      if (type === "checkbox") {
        parsedValue = (e.target as HTMLInputElement).checked;
      } else if (type === "number") {
        parsedValue = value === "" ? "" : Number(value);
      }

      setFieldValue(name as keyof T, parsedValue);
    },
    [setFieldValue],
  );

  // Handle input blur
  const handleBlur = useCallback(
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name } = e.target;
      setFieldTouched(name as keyof T, true);
      validateField(name as keyof T);
    },
    [setFieldTouched, validateField],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Mark all fields as touched
      const touchedFields: TouchedRecord<T> = {};
      Object.keys(values).forEach((key) => {
        touchedFields[key as keyof T] = true;
      });
      setTouched(touchedFields);

      // Validate the form
      const isValid = await validateFormValues();

      if (isValid) {
        setSubmitting(true);

        try {
          await onSubmit(values, {
            setSubmitting,
            resetForm,
            setValues: handleSetValues,
            setErrors,
            setFieldValue,
            setFieldError,
            setFieldTouched,
          });
        } catch (error) {
          console.error("Form submission error:", error);
        } finally {
          setSubmitting(false);
        }
      }
    },
    [
      values,
      validateFormValues,
      onSubmit,
      resetForm,
      handleSetValues,
      setFieldValue,
      setFieldError,
      setFieldTouched,
    ],
  );

  // Get field props for easier form field setup
  const getFieldProps = useCallback(
    (field: keyof T) => {
      return {
        name: field,
        value: values[field],
        onChange: handleChange,
        onBlur: handleBlur,
        error: errors[field],
        touched: touched[field],
      };
    },
    [values, errors, touched, handleChange, handleBlur],
  );

  // Check if the form is valid
  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    resetForm,
    setValues: handleSetValues,
    setErrors,
    validateField,
    validateForm: validateFormValues,
    getFieldProps,
  };
}
