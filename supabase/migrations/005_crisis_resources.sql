-- Add country field to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country TEXT;

-- Create crisis_resources table with JSONB for structured data
CREATE TABLE IF NOT EXISTS public.crisis_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL UNIQUE, -- 'AU', 'US', 'UK', 'CA', 'NZ', 'IE'
  country_name TEXT NOT NULL,
  emergency_number TEXT NOT NULL,
  nhs_mental_health TEXT, -- UK specific
  primary_crisis_line JSONB NOT NULL,
  resources JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.crisis_resources ENABLE ROW LEVEL SECURITY;

-- Anyone can read crisis resources (important for safety)
CREATE POLICY "Anyone can view crisis resources" ON public.crisis_resources
  FOR SELECT USING (true);

-- Only authenticated users can insert/update/delete (admin function)
CREATE POLICY "Authenticated users can manage crisis resources" ON public.crisis_resources
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Add updated_at trigger
CREATE TRIGGER update_crisis_resources_updated_at BEFORE UPDATE ON public.crisis_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed crisis resources from JSON file data
INSERT INTO public.crisis_resources (country_code, country_name, emergency_number, nhs_mental_health, primary_crisis_line, resources) VALUES

('AU', 'Australia', '000', NULL, 
  '{"name": "Lifeline", "phone": "13 11 14", "text": "0477 13 11 14", "hours": "24/7", "website": "lifeline.org.au"}'::jsonb,
  '{"mental_health": [{"name": "Lifeline", "phone": "13 11 14", "text": "0477 13 11 14", "hours": "24/7", "description": "Crisis support and suicide prevention"}, {"name": "Suicide Call Back Service", "phone": "1300 659 467", "hours": "24/7", "website": "suicidecallbackservice.org.au"}, {"name": "Beyond Blue", "phone": "1300 22 4636", "hours": "24/7", "website": "beyondblue.org.au", "description": "Anxiety, depression, suicide prevention"}, {"name": "13YARN", "phone": "13 92 76", "hours": "24/7", "description": "Aboriginal and Torres Strait Islander crisis support"}], "young_people": [{"name": "Kids Helpline", "phone": "1800 55 1800", "hours": "24/7", "website": "kidshelpline.com.au", "description": "Ages 5-25"}], "domestic_violence": [{"name": "1800RESPECT", "phone": "1800 737 732", "text": "0458 737 732", "hours": "24/7", "website": "1800respect.org.au", "description": "Family, domestic and sexual violence"}], "addiction": [{"name": "Gambling Helpline", "phone": "1800 858 858", "hours": "24/7"}], "lgbtiq": [{"name": "QLife", "phone": "1800 184 527", "hours": "3pm-midnight daily", "website": "qlife.org.au"}]}'::jsonb),

('UK', 'United Kingdom', '999', '111 (option 2)',
  '{"name": "Samaritans", "phone": "116 123", "email": "jo@samaritans.org", "hours": "24/7", "website": "samaritans.org"}'::jsonb,
  '{"mental_health": [{"name": "Samaritans", "phone": "116 123", "email": "jo@samaritans.org", "hours": "24/7", "description": "Emotional support for anyone in distress"}, {"name": "SHOUT", "text": "85258", "hours": "24/7", "description": "Text SHOUT for crisis support"}, {"name": "CALM", "phone": "0800 58 58 58", "hours": "5pm-midnight daily", "website": "thecalmzone.net"}, {"name": "SANEline", "phone": "0300 304 7000", "hours": "4:30pm-10pm daily"}], "young_people": [{"name": "Childline", "phone": "0800 1111", "hours": "24/7", "website": "childline.org.uk", "description": "Under 19s"}, {"name": "Papyrus HOPELINE247", "phone": "0800 068 41 41", "text": "07860 039967", "hours": "24/7", "description": "Under 35s"}], "domestic_violence": [{"name": "National Domestic Abuse Helpline", "phone": "0808 2000 247", "hours": "24/7", "website": "nationaldahelpline.org.uk"}], "sexual_assault": [{"name": "Rape Crisis", "phone": "0808 500 2222", "hours": "24/7", "website": "rapecrisis.org.uk"}], "lgbtiq": [{"name": "Switchboard LGBT+", "phone": "0800 0119 100", "hours": "10am-10pm daily"}]}'::jsonb),

('US', 'United States', '911', NULL,
  '{"name": "988 Suicide & Crisis Lifeline", "phone": "988", "text": "988", "hours": "24/7", "website": "988lifeline.org", "spanish": "Dial 988, press 2"}'::jsonb,
  '{"mental_health": [{"name": "988 Suicide & Crisis Lifeline", "phone": "988", "text": "988", "hours": "24/7", "website": "988lifeline.org", "description": "Suicide, mental health, substance use crisis"}, {"name": "Crisis Text Line", "text": "HOME to 741741", "hours": "24/7"}, {"name": "Veterans Crisis Line", "phone": "988 (press 1)", "text": "838255", "hours": "24/7"}], "young_people": [{"name": "The Trevor Project", "phone": "1-866-488-7386", "text": "START to 678-678", "hours": "24/7", "website": "thetrevorproject.org", "description": "LGBTQ+ young people"}], "domestic_violence": [{"name": "National Domestic Violence Hotline", "phone": "1-800-799-7233", "text": "START to 88788", "hours": "24/7", "website": "thehotline.org"}], "sexual_assault": [{"name": "RAINN", "phone": "1-800-656-4673", "hours": "24/7", "website": "rainn.org"}], "addiction": [{"name": "SAMHSA National Helpline", "phone": "1-800-662-4357", "hours": "24/7", "description": "Substance use and mental health referrals"}], "lgbtiq": [{"name": "Trans Lifeline", "phone": "1-877-565-8860", "hours": "24/7"}]}'::jsonb),

('CA', 'Canada', '911', NULL,
  '{"name": "988 Suicide Crisis Helpline", "phone": "988", "text": "988", "hours": "24/7", "website": "988.ca", "languages": "English and French"}'::jsonb,
  '{"mental_health": [{"name": "988 Suicide Crisis Helpline", "phone": "988", "text": "988", "hours": "24/7", "website": "988.ca"}, {"name": "Hope for Wellness", "phone": "1-855-242-3310", "hours": "24/7", "website": "hopeforwellness.ca", "description": "Indigenous peoples - Cree, Ojibway, Inuktitut available"}], "young_people": [{"name": "Kids Help Phone", "phone": "1-800-668-6868", "text": "CONNECT to 686868", "hours": "24/7", "website": "kidshelpphone.ca"}], "domestic_violence": [{"name": "Assaulted Women''s Helpline (Ontario)", "phone": "1-866-863-0511", "hours": "24/7"}, {"name": "SOS Violence Conjugale (Quebec)", "phone": "1-800-363-9010", "hours": "24/7"}], "lgbtiq": [{"name": "Trans Lifeline", "phone": "1-877-330-6366", "hours": "24/7"}]}'::jsonb),

('NZ', 'New Zealand', '111', NULL,
  '{"name": "1737 Need to Talk", "phone": "1737", "text": "1737", "hours": "24/7"}'::jsonb,
  '{"mental_health": [{"name": "1737 Need to Talk", "phone": "1737", "text": "1737", "hours": "24/7", "description": "Mental health and addictions"}, {"name": "Lifeline Aotearoa", "phone": "0800 543 354", "text": "4357 (HELP)", "hours": "24/7", "website": "lifeline.org.nz"}, {"name": "Suicide Crisis Helpline", "phone": "0508 828 865", "hours": "24/7", "description": "0508 TAUTOKO"}], "young_people": [{"name": "Youthline", "phone": "0800 376 633", "text": "234", "hours": "24/7", "website": "youthline.co.nz"}, {"name": "What''s Up", "phone": "0800 942 8787", "hours": "11am-11pm daily", "description": "Ages 5-19"}], "domestic_violence": [{"name": "Women''s Refuge", "phone": "0800 733 843", "hours": "24/7", "description": "0800 REFUGE"}, {"name": "Shine", "phone": "0508 744 633", "hours": "24/7"}, {"name": "Shakti", "phone": "0800 742 584", "hours": "24/7", "description": "Migrant and refugee women"}], "sexual_assault": [{"name": "Safe to Talk", "phone": "0800 044 334", "text": "4334", "hours": "24/7"}], "addiction": [{"name": "Alcohol Drug Helpline", "phone": "0800 787 797", "text": "8681", "hours": "24/7"}], "lgbtiq": [{"name": "OUTLine", "phone": "0800 688 5463", "hours": "6pm-9pm daily"}]}'::jsonb),

('IE', 'Ireland', '999 or 112', NULL,
  '{"name": "Samaritans Ireland", "phone": "116 123", "email": "jo@samaritans.org", "hours": "24/7"}'::jsonb,
  '{"mental_health": [{"name": "Samaritans Ireland", "phone": "116 123", "email": "jo@samaritans.org", "hours": "24/7"}, {"name": "Pieta", "phone": "1800 247 247", "text": "HELP to 51444", "hours": "24/7", "website": "pieta.ie", "description": "Suicide, self-harm, bereavement by suicide"}, {"name": "Text About It", "text": "HELLO to 50808", "hours": "24/7"}, {"name": "Aware", "phone": "1800 804 848", "hours": "10am-10pm daily", "description": "Depression and bipolar"}], "young_people": [{"name": "Childline", "phone": "1800 66 66 66", "text": "50101", "hours": "24/7", "website": "childline.ie", "description": "Under 18s"}, {"name": "Jigsaw", "website": "jigsaw.ie", "description": "Ages 12-25, online and local services"}], "domestic_violence": [{"name": "Women''s Aid", "phone": "1800 341 900", "hours": "24/7"}, {"name": "Men''s Aid", "phone": "01 554 3811", "hours": "Mon-Fri 9am-5pm"}], "sexual_assault": [{"name": "Dublin Rape Crisis Centre", "phone": "1800 778 888", "hours": "24/7"}], "addiction": [{"name": "HSE Drugs & Alcohol Helpline", "phone": "1800 459 459", "hours": "Mon-Fri 9:30am-5:30pm"}], "lgbtiq": [{"name": "LGBT Ireland", "phone": "1800 929 539"}]}'::jsonb);

-- Create index for faster lookups
CREATE INDEX idx_crisis_resources_country_code ON public.crisis_resources(country_code);
