import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(`
        <html>
          <head><title>Invalid Verification Link</title></head>
          <body style="font-family: system-ui; text-align: center; padding: 50px;">
            <h1 style="color: #e53e3e;">Invalid Verification Link</h1>
            <p>This verification link is invalid or malformed.</p>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find and verify the email signup
    const { data: signup, error: findError } = await supabaseClient
      .from('email_signups')
      .select('id, email, is_verified, verification_sent_at')
      .eq('verification_token', token)
      .single();

    if (findError || !signup) {
      return new Response(`
        <html>
          <head><title>Invalid Verification Link</title></head>
          <body style="font-family: system-ui; text-align: center; padding: 50px;">
            <h1 style="color: #e53e3e;">Invalid Verification Link</h1>
            <p>This verification link is invalid or has expired.</p>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (signup.is_verified) {
      return new Response(`
        <html>
          <head><title>Already Verified</title></head>
          <body style="font-family: system-ui; text-align: center; padding: 50px;">
            <h1 style="color: #38a169;">Already Verified!</h1>
            <p>Your email <strong>${signup.email}</strong> has already been verified.</p>
            <p>You're all set for VaultAI early access!</p>
          </body>
        </html>
      `, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Check if verification link is expired (24 hours)
    const sentAt = new Date(signup.verification_sent_at);
    const now = new Date();
    const hoursSince = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60);

    if (hoursSince > 24) {
      return new Response(`
        <html>
          <head><title>Verification Link Expired</title></head>
          <body style="font-family: system-ui; text-align: center; padding: 50px;">
            <h1 style="color: #e53e3e;">Verification Link Expired</h1>
            <p>This verification link has expired. Please sign up again to receive a new verification email.</p>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Verify the email
    const { error: updateError } = await supabaseClient
      .from('email_signups')
      .update({ 
        is_verified: true, 
        verified_at: new Date().toISOString(),
        verification_token: null // Clear the token after verification
      })
      .eq('verification_token', token);

    if (updateError) {
      console.error('Verification update error:', updateError);
      return new Response(`
        <html>
          <head><title>Verification Failed</title></head>
          <body style="font-family: system-ui; text-align: center; padding: 50px;">
            <h1 style="color: #e53e3e;">Verification Failed</h1>
            <p>Something went wrong while verifying your email. Please try again later.</p>
          </body>
        </html>
      `, {
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    console.log('Email verified successfully:', signup.email);

    return new Response(`
      <html>
        <head><title>Email Verified!</title></head>
        <body style="font-family: system-ui; text-align: center; padding: 50px;">
          <h1 style="color: #38a169;">Email Verified Successfully!</h1>
          <p>Thank you! Your email <strong>${signup.email}</strong> has been verified.</p>
          <p>You're now on the VaultAI early access waitlist. We'll notify you when we launch!</p>
          <div style="margin-top: 30px;">
            <a href="/" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Back to VaultAI
            </a>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error: any) {
    console.error("Error in verify-email function:", error);
    return new Response(`
      <html>
        <head><title>Verification Error</title></head>
        <body style="font-family: system-ui; text-align: center; padding: 50px;">
          <h1 style="color: #e53e3e;">Something Went Wrong</h1>
          <p>There was an error processing your verification. Please try again later.</p>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
};

serve(handler);