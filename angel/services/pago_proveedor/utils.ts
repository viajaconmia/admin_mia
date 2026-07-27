export const generateDispersionId = (): string => {
  let n: number;
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    n = arr[0];
  } else {
    n = Math.floor(Math.random() * 0xffffffff);
  }
  return "D" + (n % 36 ** 8).toString(36).padStart(6, "0").toUpperCase();
};
