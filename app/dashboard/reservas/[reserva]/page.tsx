import { fetchHoteles } from "@/services/hoteles";
import { ReservationForm } from "../_components/reservation_edit";
// import React, { useEffect, useState } from "react";
// import { PencilIcon } from "lucide-react";
// import { CheckIcon, XIcon } from "lucide-react";
// import { useParams } from "next/navigation";
// import { fetchReserva } from "@/services/reservas";

// // Utility functions
// const formatCurrency = (value: string) => {
//   if (!value) return "-";
//   return new Intl.NumberFormat("es-MX", {
//     style: "currency",
//     currency: "MXN",
//   }).format(parseFloat(value));
// };

// const formatDate = (dateString: string) => {
//   if (!dateString) return "-";
//   try {
//     const date = new Date(dateString);
//     return new Intl.DateTimeFormat("es-MX", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     }).format(date);
//   } catch (error) {
//     return dateString || "-";
//   }
// };

// const formatBoolean = (value: boolean | null) => {
//   if (value === null || value === undefined) return "-";
//   return value ? "Sí" : "No";
// };

// // Status Badge Component
// const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
//   const getStatusStyle = () => {
//     switch (status.toLowerCase()) {
//       case "confirmada":
//         return "bg-green-100 text-green-800";
//       case "pendiente":
//         return "bg-yellow-100 text-yellow-800";
//       case "cancelada":
//         return "bg-red-100 text-red-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   return (
//     <span
//       className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle()}`}
//     >
//       {status}
//     </span>
//   );
// };

async function App() {
  // const [bookingDetails, setBookingDetails] = useState<any>(null);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  // const [changes, setChanges] = useState<Record<string, any>>({});
  // const { reserva } = useParams();
  // // In a real app, this would come from your router
  // const id = reserva; // Mock reservation ID

  // useEffect(() => {
  //   setLoading(true);
  //   fetchReserva(id, (data) => {
  //     setBookingDetails(data);
  //     setLoading(false);
  //   }).catch((err) => {
  //     setError("Error al cargar los detalles de la reservación");
  //     setLoading(false);
  //     console.error(err);
  //   });
  // }, [id]);

  // const handleFieldChange = (
  //   objectType: string,
  //   objectId: string,
  //   field: string,
  //   value: any
  // ) => {
  //   setChanges((prevChanges) => {
  //     const newChanges = { ...prevChanges };
  //     if (!newChanges[objectType]) {
  //       newChanges[objectType] = {};
  //     }
  //     if (!newChanges[objectType][objectId]) {
  //       newChanges[objectType][objectId] = {};
  //     }
  //     newChanges[objectType][objectId][field] = value;
  //     return newChanges;
  //   });
  // };

  // const handleSaveChanges = () => {
  //   console.log("Saving changes:", changes);
  //   alert("Los cambios se guardarían en este punto");
  // };

  const response = await fetchHoteles();

  console.log(response);
  if (true) {
    return <ReservationForm hotels={response} solicitud={{}} />;
  }

  //   if (loading) {
  //     return (
  //       <div className="flex items-center justify-center min-h-screen">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
  //         <span className="ml-3 text-gray-700">Cargando detalles...</span>
  //       </div>
  //     );
  //   }

  //   if (error || !bookingDetails) {
  //     return (
  //       <div className="min-h-screen bg-gray-50 p-6">
  //         <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
  //           {error || "No se encontraron detalles de la reservación"}
  //         </div>
  //       </div>
  //     );
  //   }

  //   const { booking, hospedaje, servicio, items } = bookingDetails;
  //   const hasChanges = Object.keys(changes).length > 0;

  //   return (
  //     <div className="min-h-screen py-8">
  //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  //         {hasChanges && (
  //           <div className="sticky top-4 z-10 mb-6 flex justify-end">
  //             <button
  //               onClick={handleSaveChanges}
  //               className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md shadow-sm transition-colors"
  //             >
  //               Guardar Todos los Cambios
  //             </button>
  //           </div>
  //         )}

  //         <div className="space-y-6">
  //           {/* Header */}
  //           <div className="bg-white shadow rounded-lg p-6">
  //             <div className="flex justify-between items-start">
  //               <div>
  //                 <EditableField
  //                   label="Hotel"
  //                   value={hospedaje.nombre_hotel}
  //                   objectType="hospedaje"
  //                   objectId={hospedaje.id_hospedaje}
  //                   field="nombre_hotel"
  //                   onFieldChange={handleFieldChange}
  //                   changes={changes}
  //                 />
  //                 <p className="text-sm text-gray-500">
  //                   Código de reservación: {hospedaje.codigo_reservacion_hotel}
  //                 </p>
  //               </div>
  //               <div className="flex items-center">
  //                 <StatusBadge status={booking.estado} />
  //                 <button
  //                   className="ml-3 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors"
  //                   onClick={() => {
  //                     const newStatus = prompt(
  //                       "Cambiar estado (confirmada, pendiente, cancelada):",
  //                       booking.estado
  //                     );
  //                     if (newStatus) {
  //                       handleFieldChange(
  //                         "booking",
  //                         booking.id_booking,
  //                         "estado",
  //                         newStatus.toLowerCase()
  //                       );
  //                     }
  //                   }}
  //                 >
  //                   Cambiar
  //                 </button>
  //               </div>
  //             </div>
  //           </div>

  //           {/* Main Content */}
  //           <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
  //             {/* Booking Details */}
  //             <div className="bg-white shadow rounded-lg p-6">
  //               <h2 className="text-lg font-semibold text-gray-900 mb-4">
  //                 Detalles de la Reservación
  //               </h2>
  //               <dl className="grid grid-cols-1 gap-4">
  //                 <EditableField
  //                   label="Check-in"
  //                   value={booking.check_in}
  //                   objectType="booking"
  //                   objectId={booking.id_booking}
  //                   field="check_in"
  //                   onFieldChange={handleFieldChange}
  //                   changes={changes}
  //                   type="date"
  //                   formatter={formatDate}
  //                 />

  //                 <EditableField
  //                   label="Check-out"
  //                   value={booking.check_out}
  //                   objectType="booking"
  //                   objectId={booking.id_booking}
  //                   field="check_out"
  //                   onFieldChange={handleFieldChange}
  //                   changes={changes}
  //                   type="date"
  //                   formatter={formatDate}
  //                 />

  //                 <EditableField
  //                   label="Noches"
  //                   value={hospedaje.noches}
  //                   objectType="hospedaje"
  //                   objectId={hospedaje.id_hospedaje}
  //                   field="noches"
  //                   onFieldChange={handleFieldChange}
  //                   changes={changes}
  //                   type="number"
  //                 />

  //                 <EditableField
  //                   label="Tipo de habitación"
  //                   value={hospedaje.tipo_cuarto}
  //                   objectType="hospedaje"
  //                   objectId={hospedaje.id_hospedaje}
  //                   field="tipo_cuarto"
  //                   onFieldChange={handleFieldChange}
  //                   changes={changes}
  //                 />
  //               </dl>
  //             </div>

  //             {/* Financial Details */}
  //             <div className="bg-white shadow rounded-lg p-6">
  //               <h2 className="text-lg font-semibold text-gray-900 mb-4">
  //                 Detalles Financieros
  //               </h2>
  //               <dl className="grid grid-cols-1 gap-4">
  //                 <EditableField
  //                   label="Subtotal"
  //                   value={booking.subtotal}
  //                   objectType="booking"
  //                   objectId={booking.id_booking}
  //                   field="subtotal"
  //                   onFieldChange={handleFieldChange}
  //                   changes={changes}
  //                   type="number"
  //                   formatter={formatCurrency}
  //                 />

  //                 <EditableField
  //                   label="Impuestos"
  //                   value={booking.impuestos}
  //                   objectType="booking"
  //                   objectId={booking.id_booking}
  //                   field="impuestos"
  //                   onFieldChange={handleFieldChange}
  //                   changes={changes}
  //                   type="number"
  //                   formatter={formatCurrency}
  //                 />

  //                 <EditableField
  //                   label="Total"
  //                   value={booking.total}
  //                   objectType="booking"
  //                   objectId={booking.id_booking}
  //                   field="total"
  //                   onFieldChange={handleFieldChange}
  //                   changes={changes}
  //                   type="number"
  //                   formatter={formatCurrency}
  //                 />

  //                 <EditableField
  //                   label="Fecha límite de cancelación"
  //                   value={booking.fecha_limite_cancelacion}
  //                   objectType="booking"
  //                   objectId={booking.id_booking}
  //                   field="fecha_limite_cancelacion"
  //                   onFieldChange={handleFieldChange}
  //                   changes={changes}
  //                   type="date"
  //                   formatter={formatDate}
  //                 />
  //               </dl>
  //             </div>
  //           </div>

  //           {/* Hospedaje Details */}
  //           <div className="bg-white shadow rounded-lg p-6">
  //             <h2 className="text-lg font-semibold text-gray-900 mb-4">
  //               Detalles del Hospedaje
  //             </h2>
  //             <dl className="grid grid-cols-1 gap-4">
  //               <EditableField
  //                 label="Cadena de hotel"
  //                 value={hospedaje.cadena_hotel}
  //                 objectType="hospedaje"
  //                 objectId={hospedaje.id_hospedaje}
  //                 field="cadena_hotel"
  //                 onFieldChange={handleFieldChange}
  //                 changes={changes}
  //               />

  //               <EditableField
  //                 label="Reembolsable"
  //                 value={hospedaje.is_rembolsable}
  //                 objectType="hospedaje"
  //                 objectId={hospedaje.id_hospedaje}
  //                 field="is_rembolsable"
  //                 onFieldChange={handleFieldChange}
  //                 changes={changes}
  //                 type="boolean"
  //                 formatter={formatBoolean}
  //               />

  //               {hospedaje.is_rembolsable && (
  //                 <EditableField
  //                   label="Monto de penalización"
  //                   value={hospedaje.monto_penalizacion}
  //                   objectType="hospedaje"
  //                   objectId={hospedaje.id_hospedaje}
  //                   field="monto_penalizacion"
  //                   onFieldChange={handleFieldChange}
  //                   changes={changes}
  //                   type="number"
  //                   formatter={formatCurrency}
  //                 />
  //               )}

  //               <EditableField
  //                 label="Conciliado"
  //                 value={hospedaje.conciliado}
  //                 objectType="hospedaje"
  //                 objectId={hospedaje.id_hospedaje}
  //                 field="conciliado"
  //                 onFieldChange={handleFieldChange}
  //                 changes={changes}
  //                 type="boolean"
  //                 formatter={formatBoolean}
  //               />
  //             </dl>
  //           </div>

  //           {/* Items Section */}
  //           <div className="bg-white shadow rounded-lg overflow-hidden">
  //             <div className="px-6 py-4 border-b border-gray-200">
  //               <h2 className="text-lg font-semibold text-gray-900">
  //                 Desglose de Items y Pagos
  //               </h2>
  //             </div>
  //             <div className="px-6 py-4">
  //               {items.map((item: any, index: number) => (
  //                 <div
  //                   key={
  //                     item.id_item + Math.round(Math.random() * 999999).toString()
  //                   }
  //                   className={`${index > 0 ? "mt-8 pt-8 border-t" : ""}`}
  //                 >
  //                   <h3 className="text-md font-medium text-gray-900 mb-4">
  //                     Item #{index + 1}
  //                   </h3>

  //                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
  //                     <div className="p-4 rounded-lg border border-gray-100">
  //                       <h4 className="text-sm font-medium text-gray-900 mb-3">
  //                         Información General
  //                       </h4>
  //                       <dl className="grid grid-cols-1 gap-3">
  //                         <EditableField
  //                           label="Subtotal"
  //                           value={item.subtotal}
  //                           objectType="item"
  //                           objectId={item.id_item}
  //                           field="subtotal"
  //                           onFieldChange={handleFieldChange}
  //                           changes={changes}
  //                           type="number"
  //                           formatter={formatCurrency}
  //                         />

  //                         <EditableField
  //                           label="Impuestos"
  //                           value={item.impuestos}
  //                           objectType="item"
  //                           objectId={item.id_item}
  //                           field="impuestos"
  //                           onFieldChange={handleFieldChange}
  //                           changes={changes}
  //                           type="number"
  //                           formatter={formatCurrency}
  //                         />

  //                         <EditableField
  //                           label="Total"
  //                           value={item.total}
  //                           objectType="item"
  //                           objectId={item.id_item}
  //                           field="total"
  //                           onFieldChange={handleFieldChange}
  //                           changes={changes}
  //                           type="number"
  //                           formatter={formatCurrency}
  //                         />
  //                       </dl>
  //                     </div>
  //                   </div>

  //                   {/* Taxes Breakdown */}
  //                   <div className="mb-6">
  //                     <h4 className="text-sm font-medium text-gray-900 mb-3">
  //                       Desglose de Impuestos
  //                     </h4>
  //                     <div className="bg-gray-50 rounded-lg overflow-hidden">
  //                       <table className="min-w-full divide-y divide-gray-200">
  //                         <thead className="bg-gray-100">
  //                           <tr>
  //                             <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
  //                               ID Impuesto
  //                             </th>
  //                             <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
  //                               Base
  //                             </th>
  //                             <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
  //                               Total
  //                             </th>
  //                           </tr>
  //                         </thead>
  //                         <tbody className="divide-y divide-gray-200">
  //                           {item.impuestos_detalle.map((impuesto: any) => (
  //                             <tr
  //                               key={`${impuesto.id_impuesto}-${
  //                                 impuesto.id_item
  //                               }-${Math.round(Math.random() * 9999999)}`}
  //                             >
  //                               <td className="px-4 py-2 text-sm text-gray-900">
  //                                 {impuesto.id_impuesto}
  //                               </td>
  //                               <td className="px-4 py-2 text-sm text-gray-900">
  //                                 <EditableField
  //                                   label=""
  //                                   value={impuesto.base}
  //                                   objectType="impuesto"
  //                                   objectId={`${impuesto.id_impuesto}-${impuesto.id_item}`}
  //                                   field="base"
  //                                   onFieldChange={handleFieldChange}
  //                                   changes={changes}
  //                                   type="number"
  //                                   formatter={formatCurrency}
  //                                 />
  //                               </td>
  //                               <td className="px-4 py-2 text-sm text-gray-900">
  //                                 <EditableField
  //                                   label=""
  //                                   value={impuesto.total}
  //                                   objectType="impuesto"
  //                                   objectId={`${impuesto.id_impuesto}-${impuesto.id_item}`}
  //                                   field="total"
  //                                   onFieldChange={handleFieldChange}
  //                                   changes={changes}
  //                                   type="number"
  //                                   formatter={formatCurrency}
  //                                 />
  //                               </td>
  //                             </tr>
  //                           ))}
  //                         </tbody>
  //                       </table>
  //                     </div>
  //                   </div>

  //                   {/* Payments */}
  //                   <div>
  //                     <h4 className="text-sm font-medium text-gray-900 mb-3">
  //                       Pagos Realizados
  //                     </h4>
  //                     <div className="bg-gray-50 rounded-lg overflow-hidden">
  //                       <table className="min-w-full divide-y divide-gray-200">
  //                         <thead className="bg-gray-100">
  //                           <tr>
  //                             <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
  //                               ID Pago
  //                             </th>
  //                             <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
  //                               Monto
  //                             </th>
  //                           </tr>
  //                         </thead>
  //                         <tbody className="divide-y divide-gray-200">
  //                           {item.pagos.map((pago: any) => (
  //                             <tr key={`${pago.id_pago}-${pago.id_item}`}>
  //                               <td className="px-4 py-2 text-sm text-gray-900">
  //                                 {pago.id_pago}
  //                               </td>
  //                               <td className="px-4 py-2 text-sm text-gray-900">
  //                                 <EditableField
  //                                   label=""
  //                                   value={pago.monto}
  //                                   objectType="pago"
  //                                   objectId={`${pago.id_pago}-${pago.id_item}`}
  //                                   field="monto"
  //                                   onFieldChange={handleFieldChange}
  //                                   changes={changes}
  //                                   type="number"
  //                                   formatter={formatCurrency}
  //                                 />
  //                               </td>
  //                             </tr>
  //                           ))}
  //                         </tbody>
  //                       </table>
  //                     </div>
  //                   </div>
  //                 </div>
  //               ))}
  //             </div>
  //           </div>

  //           {/* Debug panel to view changes */}
  //           {hasChanges && (
  //             <div className="bg-white shadow rounded-lg p-6 mt-6">
  //               <h2 className="text-lg font-semibold text-gray-900 mb-4">
  //                 Cambios Realizados
  //               </h2>
  //               <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-96">
  //                 {JSON.stringify(changes, null, 2)}
  //               </pre>
  //             </div>
  //           )}
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // interface EditableFieldProps {
  //   label: string;
  //   value: string | number | boolean | null;
  //   objectType: string;
  //   objectId: string;
  //   field: string;
  //   onFieldChange: (
  //     objectType: string,
  //     objectId: string,
  //     field: string,
  //     value: any
  //   ) => void;
  //   changes: Record<string, any>;
  //   type?: "text" | "date" | "number" | "boolean" | "select";
  //   options?: Array<{ value: string; label: string }>;
  //   formatter?: (value: any) => string;
  // }

  // interface EditableFieldProps {
  //   label: string;
  //   value: string | number | boolean | null;
  //   objectType: string;
  //   objectId: string;
  //   field: string;
  //   onFieldChange: (
  //     objectType: string,
  //     objectId: string,
  //     field: string,
  //     value: any
  //   ) => void;
  //   changes: Record<string, any>;
  //   type?: "text" | "date" | "number" | "boolean" | "select";
  //   options?: Array<{ value: string; label: string }>;
  //   formatter?: (value: any) => string;
  // }

  // const EditableField: React.FC<EditableFieldProps> = ({
  //   label,
  //   value,
  //   objectType,
  //   objectId,
  //   field,
  //   onFieldChange,
  //   changes,
  //   type = "text",
  //   options = [],
  //   formatter,
  // }) => {
  //   const [isEditing, setIsEditing] = useState(false);
  //   const [editValue, setEditValue] = useState<any>(value);

  //   const hasChanged = changes[objectType]?.[objectId]?.[field] !== undefined;
  //   const displayValue = hasChanged
  //     ? changes[objectType][objectId][field]
  //     : value;

  //   const handleEditClick = () => {
  //     setEditValue(hasChanged ? changes[objectType][objectId][field] : value);
  //     setIsEditing(true);
  //   };

  //   const handleSave = () => {
  //     onFieldChange(objectType, objectId, field, editValue);
  //     setIsEditing(false);
  //   };

  //   const handleCancel = () => {
  //     setIsEditing(false);
  //   };

  //   const formatValue = (val: any) => {
  //     if (formatter) {
  //       return formatter(val);
  //     }

  //     if (val === null || val === undefined) {
  //       return "-";
  //     }

  //     if (typeof val === "boolean") {
  //       return val ? "Sí" : "No";
  //     }

  //     if (type === "select" && options.length > 0) {
  //       const option = options.find((opt) => opt.value === val);
  //       return option ? option.label : val;
  //     }

  //     return String(val);
  //   };

  //   return (
  //     <div className="sm:grid sm:grid-cols-3 sm:gap-4">
  //       <dt className="text-sm font-medium text-gray-500">{label}</dt>
  //       <dd
  //         className={`mt-1 text-sm sm:col-span-2 sm:mt-0 flex items-center ${
  //           hasChanged ? "text-blue-600 font-medium" : "text-gray-900"
  //         }`}
  //       >
  //         {isEditing ? (
  //           <div className="flex items-center gap-2 w-full">
  //             {type === "select" && options.length > 0 ? (
  //               <select
  //                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 py-1 px-2 text-sm"
  //                 value={editValue || ""}
  //                 onChange={(e) => setEditValue(e.target.value)}
  //               >
  //                 {options.map((option) => (
  //                   <option key={option.value} value={option.value}>
  //                     {option.label}
  //                   </option>
  //                 ))}
  //               </select>
  //             ) : type === "boolean" ? (
  //               <select
  //                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 py-1 px-2 text-sm"
  //                 value={editValue?.toString() || "false"}
  //                 onChange={(e) => setEditValue(e.target.value === "true")}
  //               >
  //                 <option value="true">Sí</option>
  //                 <option value="false">No</option>
  //               </select>
  //             ) : type === "date" ? (
  //               <input
  //                 type="date"
  //                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 py-1 px-2 text-sm"
  //                 value={editValue || ""}
  //                 onChange={(e) => setEditValue(e.target.value)}
  //               />
  //             ) : type === "number" ? (
  //               <input
  //                 type="number"
  //                 step="0.01"
  //                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 py-1 px-2 text-sm"
  //                 value={editValue || ""}
  //                 onChange={(e) => setEditValue(e.target.value)}
  //               />
  //             ) : (
  //               <input
  //                 type="text"
  //                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 py-1 px-2 text-sm"
  //                 value={editValue || ""}
  //                 onChange={(e) => setEditValue(e.target.value)}
  //               />
  //             )}
  //             <button
  //               onClick={handleSave}
  //               className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
  //               title="Guardar"
  //             >
  //               <CheckIcon size={16} />
  //             </button>
  //             <button
  //               onClick={handleCancel}
  //               className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
  //               title="Cancelar"
  //             >
  //               <XIcon size={16} />
  //             </button>
  //           </div>
  //         ) : (
  //           <div className="flex items-center gap-2 w-full">
  //             <span className={hasChanged ? "text-blue-600" : ""}>
  //               {formatValue(displayValue)}
  //             </span>
  //             <button
  //               onClick={handleEditClick}
  //               className="p-1 ml-2 bg-gray-50 text-gray-400 rounded hover:bg-gray-100 hover:text-gray-600 transition-colors"
  //               title="Editar"
  //             >
  //               <PencilIcon size={16} />
  //             </button>
  //             {hasChanged && (
  //               <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
  //                 Modificado
  //               </span>
  //             )}
  //           </div>
  //         )}
  //       </dd>
  //     </div>
  //   );
}

export default App;
