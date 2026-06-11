import { convertTemp, type TempUnit } from "@/lib/units/convert";
import type { Lang } from "@/lib/i18n";

/** Oven temperature shown in both scales, e.g. "Oven: 215°C (419°F)". */
export function OvenTemp({ value, unit, lang }: { value: number; unit: TempUnit; lang: Lang }) {
  const other: TempUnit = unit === "C" ? "F" : "C";
  const converted = Math.round(convertTemp(value, unit, other));
  const label = lang === "sv" ? "Ugn" : "Oven";
  return (
    <span>
      {label}: {value}°{unit} ({converted}°{other})
    </span>
  );
}
