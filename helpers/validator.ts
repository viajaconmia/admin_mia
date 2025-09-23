export const isSomeNull = (objeto) => {
  return Object.values(objeto).some((item) => item === null);
};
