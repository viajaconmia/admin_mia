export const fmtMoney = (v: string | number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    Number(v ?? 0),
  );
