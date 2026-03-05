
// ============================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================
// SEGURANÇA: As chaves abaixo também estão guardadas no arquivo .env
// na raiz do projeto. O arquivo .env NÃO deve ser enviado ao Git.
// Consulte .env.example para ver o modelo das variáveis necessárias.
//
// Você encontra essas chaves no Dashboard do Supabase -> Settings -> API
// ============================================

const SUPABASE_URL = "https://eahrqlfdixqjwuygdkip.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhaHJxbGZkaXhxand1eWdka2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Nzg5OTgsImV4cCI6MjA4NTI1NDk5OH0.6_J6lN2BGluF8tcSIxX-BwN8sv69gN6oNhVqzoIsYxU";

// Verifica se as chaves foram configuradas
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase não configurado! Edite o arquivo js/supabase-config.js");
}

// Initialize Supabase Client
window.supabaseClient = null;

console.log("Supabase Debug: Checking objects...");
console.log("window.supabase:", window.supabase);
console.log("typeof createClient:", typeof createClient);

if (window.supabase && window.supabase.createClient) {
    console.log("Supabase Debug: Found window.supabase.createClient");
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else if (typeof createClient !== 'undefined') {
    console.log("Supabase Debug: Found global createClient");
    window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Check initialization
if (!window.supabaseClient) {
    console.error("CRITICAL: Supabase client failed to initialize.");
} else {
    console.log("Supabase client initialized successfully.");
}
