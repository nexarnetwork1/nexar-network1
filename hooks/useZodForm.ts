"use client";

import {
  useForm as useRHF,
  type DefaultValues,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodSchema } from "zod";

type UseZodFormProps<T extends FieldValues> = Omit<
  UseFormProps<T>,
  "resolver"
> & {
  schema: ZodSchema<T>;
};

export function useZodForm<T extends FieldValues>({
  schema,
  ...props
}: UseZodFormProps<T>): UseFormReturn<T> {
  return useRHF<T>({
    ...props,
    resolver: zodResolver(schema),
  });
}

export type { DefaultValues, FieldValues, UseFormReturn };
