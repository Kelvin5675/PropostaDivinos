-- Add all new keys to site_settings if they don't exist
INSERT INTO site_settings (key, value) VALUES
-- Typography
('font_titles', 'Syne'),
('font_body', 'Poppins'),
('font_buttons', 'Space Grotesk'),
-- Favicons
('site_favicon', 'https://raw.githubusercontent.com/kelvinirande/Divinos/main/images/Logo%20Official%202019%20E%202024Cor%20caregada.png'),
('admin_favicon', 'https://raw.githubusercontent.com/kelvinirande/Divinos/main/images/Logo%20Official%202019%20E%202024Cor%20caregada.png'),
-- Global Colors
('color_primary', '#e63946'),
-- Profiles
('admin_display_name', 'Gráfica Divinos'),
('admin_profile_pic', 'https://ui-avatars.com/api/?name=Grafica+Divinos&background=e63946&color=fff'),
-- Security
('admin_2fa_enabled', 'false'),
('admin_2fa_secret', '')
ON CONFLICT (key) DO NOTHING;

-- Detailed Site Colors
INSERT INTO site_settings (key, value) VALUES
('color_secondary', '#1d3557'),
('color_gold', '#d4af37'),
('color_bg_light', '#f8f9fa'),
('color_bg_dark', '#1a1a1a'),
('color_text_main', '#333333'),
('color_text_muted', '#666666')
ON CONFLICT (key) DO NOTHING;
