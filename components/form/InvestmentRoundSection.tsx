"use client";

import { UseFormRegister, FieldErrors, UseFormWatch } from "react-hook-form";
import { ApplicationData, roundStages, instruments, CONVERTIBLE_INSTRUMENTS } from "@/lib/schema";
import { FormField } from "./FormField";
import { SelectField } from "./SelectField";
import { SectionHeader } from "./SectionHeader";

interface Props {
  register: UseFormRegister<ApplicationData>;
  errors: FieldErrors<ApplicationData>;
  watch: UseFormWatch<ApplicationData>;
}

export function InvestmentRoundSection({ register, errors, watch }: Props) {
  const instrument = watch("instrument");
  const isConvertible = (CONVERTIBLE_INSTRUMENTS as readonly string[]).includes(instrument);

  return (
    <div className="flex flex-col gap-[14px]">
      <SectionHeader number="04" title="Investment Round" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
        <SelectField
          label="Round Stage"
          options={[...roundStages]}
          placeholder="Select stage"
          required
          error={errors.roundStage?.message}
          {...register("roundStage")}
        />
        <SelectField
          label="Instrument"
          options={[...instruments]}
          placeholder="Select instrument"
          required
          error={errors.instrument?.message}
          {...register("instrument")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
        <FormField
          label="Round Size (USD)"
          type="number"
          placeholder="500000"
          required
          error={errors.roundSize?.message}
          {...register("roundSize", { valueAsNumber: true })}
        />
        <FormField
          label="Pre-money Valuation / CAP (USD)"
          type="number"
          placeholder="3000000"
          required
          error={errors.preMoneyValuationCap?.message}
          {...register("preMoneyValuationCap", { valueAsNumber: true })}
        />
      </div>

      {isConvertible && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] p-4 rounded-xl border"
          style={{
            background: "rgba(47,109,255,0.04)",
            borderColor: "rgba(47,109,255,0.2)",
          }}
        >
          <FormField
            label="Discount Rate (%)"
            type="number"
            placeholder="20"
            required
            isConditional
            hint="e.g. 20 for 20%"
            error={errors.discountRate?.message}
            {...register("discountRate", { valueAsNumber: true })}
          />
          <FormField
            label="Interest Rate (%)"
            type="number"
            placeholder="5"
            required
            isConditional
            hint="e.g. 5 for 5% per annum"
            error={errors.interestRate?.message}
            {...register("interestRate", { valueAsNumber: true })}
          />
        </div>
      )}
    </div>
  );
}
