"use client";

import { UseFormRegister, FieldErrors } from "react-hook-form";
import { ApplicationData, verticals, salesModels, productStages } from "@/lib/schema";
import { FormField } from "./FormField";
import { SelectField } from "./SelectField";
import { TextareaField } from "./TextareaField";
import { SectionHeader } from "./SectionHeader";

interface Props {
  register: UseFormRegister<ApplicationData>;
  errors: FieldErrors<ApplicationData>;
}

export function AboutCompanySection({ register, errors }: Props) {
  return (
    <div className="flex flex-col gap-[14px]">
      <SectionHeader number="02" title="About Your Company" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
        <FormField
          label="Startup Name"
          type="text"
          placeholder="Company name"
          required
          error={errors.startupName?.message}
          {...register("startupName")}
        />
        <FormField
          label="Website"
          type="url"
          placeholder="https://yourstartup.com"
          error={errors.website?.message}
          {...register("website")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
        <FormField
          label="Country"
          type="text"
          placeholder="Mexico, Colombia…"
          required
          error={errors.country?.message}
          {...register("country")}
        />
        <FormField
          label="Year of Foundation"
          type="number"
          placeholder="2022"
          required
          error={errors.yearOfFoundation?.message}
          {...register("yearOfFoundation", { valueAsNumber: true })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
        <SelectField
          label="Vertical"
          options={[...verticals]}
          placeholder="Select vertical"
          required
          error={errors.vertical?.message}
          {...register("vertical")}
        />
        <SelectField
          label="Sales Model"
          options={[...salesModels]}
          placeholder="Select model"
          required
          error={errors.salesModel?.message}
          {...register("salesModel")}
        />
      </div>

      <TextareaField
        label="Company Description"
        rows={3}
        placeholder="Describe your company, the problem you solve and your solution in 2–3 sentences."
        required
        error={errors.companyDescription?.message}
        hint="50–1,000 characters"
        {...register("companyDescription")}
      />

      <SelectField
        label="Product / Service Stage"
        options={[...productStages]}
        placeholder="Select stage"
        required
        error={errors.productStage?.message}
        {...register("productStage")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
        <FormField
          label="Number of Co-founders"
          type="number"
          placeholder="2"
          required
          error={errors.numberOfCoFounders?.message}
          {...register("numberOfCoFounders", { valueAsNumber: true })}
        />
        <FormField
          label="Team Size"
          type="number"
          placeholder="5"
          required
          error={errors.teamSize?.message}
          {...register("teamSize", { valueAsNumber: true })}
        />
      </div>
    </div>
  );
}
