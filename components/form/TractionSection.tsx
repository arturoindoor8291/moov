"use client";

import { UseFormRegister, FieldErrors } from "react-hook-form";
import { ApplicationData } from "@/lib/schema";
import { FormField } from "./FormField";
import { SectionHeader } from "./SectionHeader";

interface Props {
  register: UseFormRegister<ApplicationData>;
  errors: FieldErrors<ApplicationData>;
}

export function TractionSection({ register, errors }: Props) {
  return (
    <div className="flex flex-col gap-[14px]">
      <SectionHeader number="03" title="Traction" />
      <FormField
        label="Net Revenue LTM (USD)"
        type="number"
        placeholder="0"
        required
        hint="Last Twelve Months. Enter 0 if pre-revenue."
        error={errors.netRevenueLTM?.message}
        {...register("netRevenueLTM", { valueAsNumber: true })}
      />
      <FormField
        label="Last Month Net Revenue (USD)"
        type="number"
        placeholder="0"
        required
        hint="Enter 0 if pre-revenue."
        error={errors.lastMonthNetRevenue?.message}
        {...register("lastMonthNetRevenue", { valueAsNumber: true })}
      />
      <FormField
        label="Total Capital Raised to Date (USD)"
        type="number"
        placeholder="0"
        required
        hint="Include all rounds — friends &amp; family, angels, previous VC. Enter 0 if bootstrapped."
        error={errors.totalCapitalRaised?.message}
        {...register("totalCapitalRaised", { valueAsNumber: true })}
      />
    </div>
  );
}
