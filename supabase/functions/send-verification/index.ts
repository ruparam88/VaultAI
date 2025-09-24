import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { email }: SignupRequest = await req.json();

    // Basic email validation
    if (!email || !email.includes("@") || email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already exists
    const { data: existingSignup, error: checkError } = await supabaseClient
      .from('email_signups')
      .select('id, is_verified')
      .eq('email', cleanEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database check error:', checkError);
      throw new Error('Database error occurred');
    }

    if (existingSignup) {
      if (existingSignup.is_verified) {
        return new Response(
          JSON.stringify({ error: "Email is already verified and on our waitlist" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: "Verification email already sent. Please check your inbox." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Insert new signup with verification token
    const { data: newSignup, error: insertError } = await supabaseClient
      .from('email_signups')
      .insert([{
        email: cleanEmail,
        verification_sent_at: new Date().toISOString(),
        user_agent: req.headers.get('user-agent') || null
      }])
      .select('verification_token')
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to save signup');
    }

    // Send verification email
    const verificationUrl = `https://dzjqyngsbmeflkqenbjt.supabase.co/functions/v1/verify-email?token=${newSignup.verification_token}`;

    const emailResponse = await resend.emails.send({
      from: "VaultAI <onboarding@resend.dev>",
      to: [cleanEmail],
      subject: "Verify your email for VaultAI early access",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <h1 style="color: #333; text-align: center;">Welcome to VaultAI!</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Thank you for signing up for early access to VaultAI. To complete your registration and join our waitlist, please verify your email address.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 6px; 
                      font-weight: 600;
                      display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #888; font-size: 14px; text-align: center;">
            This link will expire in 24 hours. If you didn't sign up for VaultAI, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error('Email send error:', emailResponse.error);
      throw new Error('Failed to send verification email');
    }

    console.log('Verification email sent successfully to:', cleanEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification email sent! Please check your inbox." 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-verification function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Something went wrong" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);