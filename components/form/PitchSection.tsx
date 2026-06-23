"use client";

import { UseFormRegister, FieldErrors } from "react-hook-form";
import { ApplicationData, referralSources } from "@/lib/schema";
import { FormField } from "./FormField";
import { SelectField } from "./SelectField";
import { SectionHeader } from "./SectionHeader";

interface Props {
  register: UseFormRegister<ApplicationData>;
  errors: FieldErrors<ApplicationData>;
}

export function PitchSection({ register, errors }: Props) {
  return (
    <div className="flex flex-col gap-[14px]">
      <SectionHeader number="05" title="Pitch" />
      <FormField
        label="Pitch Deck Link"
        type="url"
        placeholder="https://drive.google.com/..."
        required
        hint="Google Drive, Docsend, Notion, or any public link."
        error={errors.pitchDeckLink?.message}
        {...register("pitchDeckLink")}
      />
      <SelectField
        label="How did you find us?"
        options={[...referralSources]}
        placeholder="Select an option"
        required
        error={errors.howDidYouFindUs?.message}
        {...register("howDidYouFindUs")}
      />
    </div>
  );
}
