"use client";

import { UseFormRegister, FieldErrors } from "react-hook-form";
import { ApplicationData } from "@/lib/schema";
import { FormField } from "./FormField";
import { SectionHeader } from "./SectionHeader";

interface Props {
  register: UseFormRegister<ApplicationData>;
  errors: FieldErrors<ApplicationData>;
}

export function AboutYouSection({ register, errors }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader number="01" title="About You" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
        <FormField
          label="Founder Name"
          type="text"
          placeholder="Full name"
          required
          error={errors.founderName?.message}
          {...register("founderName")}
        />
        <FormField
          label="Email"
          type="email"
          placeholder="you@startup.com"
          required
          error={errors.email?.message}
          {...register("email")}
        />
      </div>
      <FormField
        label="LinkedIn URL"
        type="url"
        placeholder="https://linkedin.com/in/yourname"
        required
        error={errors.linkedinUrl?.message}
        {...register("linkedinUrl")}
      />
    </div>
  );
}
