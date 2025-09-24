-- Create table for email signups
CREATE TABLE public.email_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable Row Level Security
ALTER TABLE public.email_signups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (public signup)
CREATE POLICY "Anyone can sign up with email" 
ON public.email_signups 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow reading count (for analytics)
CREATE POLICY "Anyone can view signup count" 
ON public.email_signups 
FOR SELECT 
USING (true);

-- Create index for better performance
CREATE INDEX idx_email_signups_created_at ON public.email_signups(created_at DESC);
CREATE INDEX idx_email_signups_email ON public.email_signups(email);