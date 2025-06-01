import { Suspense } from "react";

export default async function Container({ children }) {
  return (
    <Suspense
      fallback={
        <>
          <h1 className="text-9xl">Cargando...</h1>
        </>
      }
    >
      {children}
    </Suspense>
  );
}
