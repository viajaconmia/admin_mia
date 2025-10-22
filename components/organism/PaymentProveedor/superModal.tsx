import React from "react";
import { X, Phone, Mail, MessageSquare } from "lucide-react";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        ></div>

        {/* Modal panel */}
        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="relative px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="sm:flex sm:items-start">
              <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-blue-100 rounded-full sm:mx-0 sm:h-14 sm:w-14">
                {/* Company Logo */}
                <svg
                  version="1.1"
                  id="Capa_1"
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  viewBox="0 0 493 539"
                  className="w-[50px] h-[50px] -rotate-12 transform text-sky-950"
                >
                  <path
                    fill="currentColor"
                    d="M205.1,500.5C205.1,500.5,205,500.6,205.1,500.5C140.5,436.1,71.7,369.1,71.7,291.1 c0-86.6,84.2-157.1,187.6-157.1S447,204.4,447,291.1c0,74.8-63.4,139.6-150.8,154.1c0,0,0,0,0,0l-8.8-53.1 c61.3-10.2,105.8-52.6,105.8-100.9c0-56.9-60-103.2-133.7-103.2s-133.7,46.3-133.7,103.2c0,49.8,48,93.6,111.7,101.8c0,0,0,0,0,0 L205.1,500.5L205.1,500.5z"
                  ></path>
                  <path
                    fill="currentColor"
                    d="M341,125.5c-2.9,0-5.8-0.7-8.6-2.1c-70.3-37.3-135.9-1.7-138.7-0.2c-8.8,4.9-20,1.8-24.9-7.1 c-4.9-8.8-1.8-20,7-24.9c3.4-1.9,85.4-47.1,173.8-0.2c9,4.8,12.4,15.9,7.6,24.8C353.9,122,347.6,125.5,341,125.5z"
                  ></path>
                  <g>
                    <path
                      fill="currentColor"
                      d="M248.8,263.8c-38.1-26-73.7-0.8-75.2,0.2c-6.4,4.6-8.7,14-5.3,21.8c1.9,4.5,5.5,7.7,9.8,8.9 c4,1.1,8.2,0.3,11.6-2.1c0.9-0.6,21.4-14.9,43.5,0.2c2.2,1.5,4.6,2.3,7.1,2.4c0.2,0,0.4,0,0.6,0c0,0,0,0,0,0 c5.9,0,11.1-3.7,13.5-9.7C257.8,277.6,255.4,268.3,248.8,263.8z"
                    ></path>
                    <path
                      fill="currentColor"
                      d="M348.8,263.8c-38.1-26-73.7-0.8-75.2,0.2c-6.4,4.6-8.7,14-5.3,21.8c1.9,4.5,5.5,7.7,9.8,8.9 c4,1.1,8.2,0.3,11.6-2.1c0.9-0.6,21.4-14.9,43.5,0.2c2.2,1.5,4.6,2.3,7.1,2.4c0.2,0,0.4,0,0.6,0c0,0,0,0,0,0 c5.9,0,11.1-3.7,13.5-9.7C357.8,277.6,355.4,268.3,348.8,263.8z"
                    ></path>
                  </g>
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Contacta a Soporte
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Estamos aquí para ayudarte. Contáctanos a través de
                    cualquiera de estos medios:
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {/* WhatsApp */}
              <a
                href="https://wa.me/5510445254"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 transition-colors border rounded-lg hover:bg-green-50 border-green-200 group"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    WhatsApp
                  </h4>
                  <p className="text-sm text-gray-500 group-hover:text-green-700">
                    5510445254
                  </p>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:support@noktos.zohodesk.com"
                className="flex items-center p-4 transition-colors border rounded-lg hover:bg-blue-50 border-blue-200 group"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Correo Electrónico
                  </h4>
                  <p className="text-sm text-gray-500 group-hover:text-blue-700">
                    support@noktos.zohodesk.com
                  </p>
                </div>
              </a>

              {/* Phone */}
              <a
                href="tel:8006665867"
                className="flex items-center p-4 transition-colors border rounded-lg hover:bg-purple-50 border-purple-200 group"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
                  <Phone className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Teléfono
                  </h4>
                  <p className="text-sm text-gray-500 group-hover:text-purple-700">
                    800 666 5867
                  </p>
                </div>
              </a>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
