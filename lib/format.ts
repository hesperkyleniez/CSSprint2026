export function peso(value: number): string {
  const negative = value < 0;
  const absolute = Math.abs(value);
  const whole = Number.isInteger(absolute);
  const text = absolute.toLocaleString("en-PH", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${negative ? "-" : ""}₱${text}`;
}

export function kilograms(value: number): string {
  return value.toLocaleString("en-PH", { maximumFractionDigits: 3 });
}

export function triple(
  values: { low: number; typical: number; high: number },
  format: (value: number) => string = kilograms,
): string {
  return `${format(values.low)} / ${format(values.typical)} / ${format(values.high)}`;
}
