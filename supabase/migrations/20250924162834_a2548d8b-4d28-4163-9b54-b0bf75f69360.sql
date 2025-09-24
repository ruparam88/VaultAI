-- Add email verification fields to email_signups table
ALTER TABLE public.email_signups 
ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN verification_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN verification_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;

-- Update policy to only show verified signups for count
DROP POLICY "Anyone can view signup count" ON public.email_signups;

CREATE POLICY "Anyone can view verified signup count" 
ON public.email_signups 
FOR SELECT 
USING (is_verified = true);

-- Create index for verification token lookups
CREATE INDEX idx_email_signups_verification_token ON public.email_signups(verification_token) WHERE verification_token IS NOT NULL;