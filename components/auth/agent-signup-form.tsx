
import { createAgente, createEmpresa, createNewViajero, createStripeUser } from "../../hooks/useDatabase";
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://iyuomxgqruhqjiygsgrw.supabase.co',
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5dW9teGdxcnVocWppeWdzZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODE0NjAsImV4cCI6MjA2ODk1NzQ2MH0.B1501bRyrshaJrTpcbTybh6XMhJJ2XKAXFVsUuglxhY" // anon key pública del proyecto de MIA
);

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const registerUserAfterVerification = async (formData: any) => {
  try {

    // Validate email format
    if (!validateEmail(formData.correo)) {
      throw new Error('El formato del correo electrónico no es válido');
    }
    // // 2. Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.correo,
      password: formData.password,
      options: {
        data: {
          full_name: formData.primer_nombre + ' ' + formData.segundo_nombre + ' ' + formData.apellido_paterno + ' ' + formData.apellido_materno,
          phone: formData.telefono
        },
        emailRedirectTo: undefined // Disable email confirmation
      }
    });

    if (authError) {
      console.error('Supabase request failed', {
        status: authError.status,
        message: authError.message
      });

      if (authError.message.includes('User already registered')) {
        throw new Error('Este correo electrónico ya está registrado');
      }

      throw new Error('Error al registrar usuario. Por favor intenta de nuevo.');
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario');
    }

    // 3. Create agent profile
    const response = await createAgente(formData, authData.user.id);
    if (!response.success) {
      throw new Error("No se pudo registrar al usuario");
    }

    // Create stripe user
    const responseCustomerStripe = await createStripeUser(formData.correo, authData.user.id);
    if (!responseCustomerStripe.success) {
      throw new Error("No se pudo registrar al usuario");
    }

    // 4. Create company profile
    const responseCompany = await createEmpresa(formData, authData.user.id);
    if (!responseCompany.success) {
      throw new Error("No se pudo registrar al usuario");
    }
    console.log(responseCompany);

    // 5. Create viajero profile
    const responseViajero = await createNewViajero(formData, [responseCompany.empresa_id]);
    if (!responseViajero.success) {
      throw new Error("No se pudo registrar al usuario");
    }
    console.log(responseViajero);

    return {
      success: true
    };
  } catch (error) {
    console.error('Registration error:', error);

    // Handle specific error cases
    if (error?.message?.includes('duplicate key value')) {
      throw new Error('Este correo electrónico ya está registrado');
    }

    if (error?.message?.includes('Password should be at least 6 characters')) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // Return a user-friendly error message
    throw new Error(error.message || 'Error al registrar. Por favor intenta de nuevo.');
  }

}