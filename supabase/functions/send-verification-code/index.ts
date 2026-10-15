
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the current user from the auth token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email }: VerificationRequest = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify that the email matches the authenticated user's email
    if (email.toLowerCase() !== user.email?.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Email does not match authenticated user' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store the verification code in the database
    const { error: insertError } = await supabaseClient
      .from('email_verification_codes')
      .insert({
        email: email.toLowerCase(),
        verification_code: verificationCode,
        expires_at: expiresAt,
        used: false
      });

    if (insertError) {
      console.error('Error storing verification code:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate verification code' }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email with verification code
    const emailResponse = await resend.emails.send({
      from: "SERPIC <serpic@serpic.online>",
      to: [email],
      subject: "Código de Verificación SERPIC",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">SERPIC</h1>
            <p style="color: #64748b; margin: 5px 0;">Sistema de Control y Seguimiento de Proyectos</p>
          </div>
          
          <h2 style="color: #334155; margin-bottom: 20px;">Código de Verificación</h2>
          
          <p style="color: #475569; line-height: 1.6;">
            Se ha solicitado acceso al sistema SERPIC desde tu cuenta. Utiliza el siguiente código para verificar tu identidad:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #2563eb; color: white; padding: 20px; border-radius: 12px; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
              ${verificationCode}
            </div>
          </div>
          
          <p style="color: #ef4444; font-weight: 500;">
            ⏰ Este código expira en 10 minutos
          </p>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            Si no solicitaste este código, puedes ignorar este email de forma segura.
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              © 2025 SERPIC S. de R.l. de C.V. | CICH 054-12-N-CT
            </p>
          </div>
        </div>
      `,
    });

    console.log("Verification code email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Código de verificación enviado' 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-verification-code function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
