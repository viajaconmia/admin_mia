import { getCompaniesAgent, getCompaniesAgentViajeros, getEmpresasDatosFiscales, getPaymentMethods, getCreditAgent, getPagosAgente, getHoteles, getPendientesAgente } from "./useDatabase";

export const fetchCompaniesAgent = async (user_id:string) => {
  try {
    const companiesData = await getCompaniesAgent(user_id);
    return companiesData.data || [];
  } catch (error) {
    console.error("Error fetching companies:", error);
    return [];
  }
};

export const fetchViajerosCompanies = async (user_id:string) => {
  try {
    const employeesData = await getCompaniesAgentViajeros(user_id);
    return employeesData.data || [];
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
};

export const fetchEmpresasDatosFiscales = async (user_id:string) => {
  try {
    const employeesData = await getEmpresasDatosFiscales(user_id);
    return employeesData.data || [];
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
};

export const fetchPaymentMethods = async (user_id:string) => {
  try {
    const paymentMehtods = await getPaymentMethods(user_id);
    return paymentMehtods || [];
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return [];
  }
};

export const fetchCreditAgent = async (user_id:string) => {
  try {
    const creditData = await getCreditAgent(user_id);
    return creditData || [];
  } catch (error) {
    console.error("Error fetching credit:", error);
    return [];
  }
};

export const fetchPagosAgent = async (user_id:string) => {
  try {
    const paymentData = await getPagosAgente(user_id);

    console.log(paymentData);
    return paymentData || [];
  } catch (error) {
    console.error("Error fetching credit:", error);
    return [];
  }
};

export const fetchPendientesAgent = async (user_id:string) => {
  try {
    const paymentData = await getPendientesAgente(user_id);

    console.log(paymentData);
    return paymentData || [];
  } catch (error) {
    console.error("Error fetching credit:", error);
    return [];
  }
};

export const fetchHoteles = async (user_id:string) => {
  try {
    const hotelsData = await getHoteles();

    console.log(hotelsData);
    return hotelsData || [];
  } catch (error) {
    console.error("Error fetching hoteles:", error);
    return [];
  }
}
