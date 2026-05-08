-- =============================================
-- WEDDING INVITATION PLATFORM SCHEMA
-- Divinos Graffic - Premium Digital Invitations
-- =============================================

-- 1. Main Invitations Table
CREATE TABLE IF NOT EXISTS wedding_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
    groom_name TEXT NOT NULL,
    bride_name TEXT NOT NULL,
    wedding_date DATE NOT NULL,
    ceremony_time TIME NOT NULL,
    reception_time TIME,
    address TEXT NOT NULL,
    google_maps_url TEXT,
    dress_code TEXT,
    theme_config JSONB DEFAULT '{}', -- Colors, fonts, layout
    couple_history JSONB DEFAULT '[]', -- List of {year, title, description, image_url}
    gallery_images JSONB DEFAULT '[]', -- List of image URLs
    background_music_url TEXT,
    playlist_url TEXT,
    save_the_date_video_url TEXT,
    pre_wedding_video_url TEXT,
    official_video_url TEXT,
    rsvp_deadline DATE,
    require_meal_choice BOOLEAN DEFAULT FALSE,
    require_dietary_restrictions BOOLEAN DEFAULT FALSE,
    password_protected BOOLEAN DEFAULT FALSE,
    invitation_password TEXT,
    pix_key TEXT, -- For cash gifts
    bank_info JSONB, -- {bank, holder, account, nib}
    active_plan TEXT DEFAULT 'basic', -- basic, bronze, silver, gold
    is_active BOOLEAN DEFAULT TRUE,
    views_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RSVP Responses
CREATE TABLE IF NOT EXISTS wedding_rsvp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID REFERENCES wedding_invitations(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'declined')),
    companions_count INT DEFAULT 0,
    companion_names TEXT,
    phone TEXT,
    dietary_restrictions TEXT,
    meal_choice TEXT,
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Gift List
CREATE TABLE IF NOT EXISTS wedding_gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID REFERENCES wedding_invitations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12,2),
    is_cash_option BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    suggested_by_couple BOOLEAN DEFAULT TRUE,
    is_purchased BOOLEAN DEFAULT FALSE,
    purchaser_name TEXT,
    purchase_proof_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Guestbook Messages (Felicitações)
CREATE TABLE IF NOT EXISTS wedding_guestbook (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID REFERENCES wedding_invitations(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    message TEXT NOT NULL,
    is_moderated BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Photo Mural (Guest Uploads)
CREATE TABLE IF NOT EXISTS wedding_mural (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID REFERENCES wedding_invitations(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    guest_name TEXT,
    is_moderated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Event Schedule (Cronograma)
CREATE TABLE IF NOT EXISTS wedding_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID REFERENCES wedding_invitations(id) ON DELETE CASCADE,
    time TIME NOT NULL,
    activity TEXT NOT NULL, -- 'Cerimónia', 'Sessão de fotos', 'Recepção', etc.
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RLS Policies
ALTER TABLE wedding_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_guestbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_mural ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_schedule ENABLE ROW LEVEL SECURITY;

-- Public Read Access (Select) - Needed for guests to see the invitation
CREATE POLICY "Public select invitations" ON wedding_invitations FOR SELECT USING (true);
CREATE POLICY "Public select rsvp" ON wedding_rsvp FOR SELECT USING (true);
CREATE POLICY "Public select gifts" ON wedding_gifts FOR SELECT USING (true);
CREATE POLICY "Public select guestbook" ON wedding_guestbook FOR SELECT USING (is_moderated = true);
CREATE POLICY "Public select mural" ON wedding_mural FOR SELECT USING (is_moderated = true);
CREATE POLICY "Public select schedule" ON wedding_schedule FOR SELECT USING (true);

-- Public Insert Access - Enabling guests to RSVP, leave messages, and upload photos
CREATE POLICY "Public insert rsvp" ON wedding_rsvp FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert guestbook" ON wedding_guestbook FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert mural" ON wedding_mural FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update gift purchase" ON wedding_gifts FOR UPDATE USING (true) WITH CHECK (true);

-- Admin Full Access
CREATE POLICY "Admin all invitations" ON wedding_invitations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all rsvp" ON wedding_rsvp FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all gifts" ON wedding_gifts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all guestbook" ON wedding_guestbook FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all mural" ON wedding_mural FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all schedule" ON wedding_schedule FOR ALL USING (auth.role() = 'authenticated');

-- 8. Functions & Triggers
CREATE OR REPLACE FUNCTION update_wedding_invitation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wedding_invitations_updated_at
    BEFORE UPDATE ON wedding_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_wedding_invitation_timestamp();
