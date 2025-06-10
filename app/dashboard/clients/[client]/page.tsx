import { Suspense } from "react";
// import {AgentDetailsCard} from "../_components/DetailsClient";

const Client = async ({ params }: { params: Promise<{ client: string }> }) => {
  try {
    const { client } = await params;
    return (
      <Suspense fallback={<h1>Cargando...</h1>}>
        <h1>hola</h1>
        {/* <AgentDetailsCard agente={client}></AgentDetailsCard> */}
      </Suspense>
    );
  } catch (error) {
    console.log(error);
    return <h1>Ocurrio un error...</h1>;
  }
};
export default Client;
