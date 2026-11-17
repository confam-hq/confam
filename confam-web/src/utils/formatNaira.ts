const fmt = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});
export const formatNaira = (n: number | string | undefined | null) => fmt.format(Number(n ?? 0));