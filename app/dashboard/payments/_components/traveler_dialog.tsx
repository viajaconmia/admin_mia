"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, CheckCircle2, Mail, PersonStanding, Phone, User, Lock } from "lucide-react";
import { registerUserAfterVerification } from "@/components/auth/agent-signup-form";

interface TravelerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TravelerDialog({
  open,
  onOpenChange,
}: TravelerDialogProps) {
  const [formData, setFormData] = useState({
    primer_nombre: '',
    segundo_nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    genero: '',
    fecha_nacimiento: '',
  });

  const [passwordError, setPasswordError] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async () => {
    try {
      if (isRegistering) return;
      setIsRegistering(true);
      setRegistrationError('');
      setRegistrationSuccess('');

      const result = await registerUserAfterVerification(formData);
      console.log(result);
      if (result.success) {
        console.log('successssss');
        setRegistrationError("");
        setRegistrationSuccess('Agente registrado correctamente');
      }
      else {
        throw new Error('Codigo incorrecto');
      }
    } catch (error: any) {
      console.error('Error during registration:', error);
      setRegistrationError(
        error.message || 'Error al registrar. Por favor intenta de nuevo.'
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    if (!formData.password || !formData.confirmPassword || !formData.primer_nombre || !formData.apellido_paterno || !formData.correo) {
      setPasswordError('No se pueden dejar vacios los campos obligatorios');
      return;
    }

    handleSubmit()
    setPasswordError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Agente</DialogTitle>
          <DialogDescription>
            Ingresa los datos del nuevo agente.
          </DialogDescription>
        </DialogHeader>
        {registrationSuccess && (
          <div className="mt-4 text-blue-300 bg-blue-900/50 p-4 rounded-lg">
            {registrationSuccess}
          </div>
        )}
        <form onSubmit={handlePersonalSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.primer_nombre}
                  onChange={(e) => setFormData({ ...formData, primer_nombre: e.target.value })}
                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Segundo Nombre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.segundo_nombre}
                  onChange={(e) => setFormData({ ...formData, segundo_nombre: e.target.value })}
                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido paterno <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.apellido_paterno}
                  onChange={(e) => setFormData({ ...formData, apellido_paterno: e.target.value })}
                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido materno
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.apellido_materno}
                  onChange={(e) => setFormData({ ...formData, apellido_materno: e.target.value })}
                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Correo Electrónico */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  required
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Genero */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sexo (Género)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PersonStanding className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="genero"
                  required
                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                >
                  <option value="">Selecciona genero</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                </select>
              </div>
            </div>

            {/* Fecha de nacimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha de nacimiento
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  required
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {passwordError && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              {passwordError}
            </div>
          )}

          <div className="flex space-x-4 w-full">
            <button
              onClick={handlePersonalSubmit}
              disabled={isRegistering}
              className={`flex items-center space-x-2 w-full justify-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${isRegistering ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              {isRegistering ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <span>Registrar Agente</span>
                </>
              )}
            </button>
          </div>
          {registrationError && (
            <div className="mt-4 text-red-300 bg-red-900/50 p-4 rounded-lg">
              {registrationError}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
