
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AccessCodeRequest {
  projectId: string;
  action: 'view' | 'edit';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the request
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { projectId, action }: AccessCodeRequest = await req.json();

    // Generate a 6-digit access code
    const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Get project details
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('name, client')
      .eq('id', projectId)
      .single();

    if (projectError) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Store the access code in the database
    const { error: insertError } = await supabaseClient
      .from('project_access_codes')
      .insert({
        user_id: user.id,
        project_id: projectId,
        access_code: accessCode,
        expires_at: expiresAt
      });

    if (insertError) {
      console.error('Error storing access code:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate access code' }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email with access code
    const actionText = action === 'edit' ? 'editar' : 'ver';
    const emailResponse = await resend.emails.send({
      from: "SERPIC <serpic@serpic.online>",
      to: [user.email!],
      subject: `Código de Acceso SERPIC - ${project.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">SERPIC</h1>
            <p style="color: #64748b; margin: 5px 0;">Sistema de Control y Seguimiento de Proyectos</p>
          </div>
          
          <h2 style="color: #334155; margin-bottom: 20px;">Código de Acceso Solicitado</h2>
          
          <p style="color: #475569; line-height: 1.6;">
            Has solicitado un código de acceso para <strong>${actionText}</strong> el proyecto:
          </p>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #334155;"><strong>${project.name}</strong></p>
            <p style="margin: 5px 0 0 0; color: #64748b;">Cliente: ${project.client}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #2563eb; color: white; padding: 20px; border-radius: 12px; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
              ${accessCode}
            </div>
          </div>
          
          <p style="color: #ef4444; font-weight: 500;">
            ⏰ Este código expira en 15 minutos
          </p>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            Si no solicitaste este código, puedes ignorar este email de forma segura.
          </p>
        </div>
      `,
    });

    console.log("Access code email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Código de acceso enviado a tu email' 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-access-code function:", error);
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
