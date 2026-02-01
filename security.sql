
-- ==============================================================================
-- SCHEMA DO PORTAL CIPA - REFINAMENTO DE SEGURANÇA (RLS GRANULAR)
-- Execute este script no SQL Editor do Supabase.
-- ==============================================================================

-- 1. EXTENSÕES E CONFIGURAÇÕES BÁSICAS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ESTRUTURA DE TABELAS (Criação idempotente)

-- Tabela de Administradores (Contas com privilégios elevados)
CREATE TABLE IF NOT EXISTS app_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Colaboradores (Dados de Negócio / Perfis)
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  matricula TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  setor TEXT,
  cargo TEXT,
  email TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  is_restricted BOOLEAN DEFAULT false, -- True para cargos de confiança (NR-5)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance de busca (Otimização para Dashboard e Filtros)
CREATE INDEX IF NOT EXISTS idx_employees_matricula ON employees (matricula);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees (email);
CREATE INDEX IF NOT EXISTS idx_employees_setor ON employees (setor);

-- Tabela de Inscrições (Candidaturas)
CREATE TABLE IF NOT EXISTS registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('approved', 'rejected', 'pending')),
  membership_type TEXT DEFAULT 'primary' CHECK (membership_type IN ('primary', 'alternate')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Votos
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  voter_matricula TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Configurações
CREATE TABLE IF NOT EXISTS app_settings (
  id BIGINT PRIMARY KEY,
  data JSONB
);

-- 3. FUNÇÃO DE VERIFICAÇÃO DE ADMIN (Security Definer)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Obtém o email do usuário autenticado via JWT do Supabase Auth
  user_email := auth.jwt() ->> 'email';
  -- Verifica se existe na tabela de admins
  RETURN EXISTS (SELECT 1 FROM app_admins WHERE email = user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE app_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE SEGURANÇA (Controle de Acesso Baseado em Roles)

-- POLÍTICAS: APP_ADMINS
DROP POLICY IF EXISTS "Admins Read Admins" ON app_admins;
DROP POLICY IF EXISTS "Admins Manage Admins" ON app_admins;
CREATE POLICY "Admins Read Admins" ON app_admins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins Manage Admins" ON app_admins FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- POLÍTICAS: EMPLOYEES
DROP POLICY IF EXISTS "Users Read Employees" ON employees;
DROP POLICY IF EXISTS "Admins Manage Employees" ON employees;
CREATE POLICY "Users Read Employees" ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins Manage Employees" ON employees FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- POLÍTICAS: REGISTRATIONS
DROP POLICY IF EXISTS "Users Read Registrations" ON registrations;
DROP POLICY IF EXISTS "Admins Manage Registrations" ON registrations;
CREATE POLICY "Users Read Registrations" ON registrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins Manage Registrations" ON registrations FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- POLÍTICAS: VOTES
DROP POLICY IF EXISTS "Users Read Votes" ON votes;
DROP POLICY IF EXISTS "Users Cast Votes" ON votes;
DROP POLICY IF EXISTS "Admins Reset Votes" ON votes;
CREATE POLICY "Users Read Votes" ON votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users Cast Votes" ON votes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins Reset Votes" ON votes FOR DELETE TO authenticated USING (is_admin());

-- POLÍTICAS: APP_SETTINGS
DROP POLICY IF EXISTS "Users Read Settings" ON app_settings;
DROP POLICY IF EXISTS "Admins Manage Settings" ON app_settings;
CREATE POLICY "Users Read Settings" ON app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins Manage Settings" ON app_settings FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- 6. INICIALIZAÇÃO DE DADOS
INSERT INTO app_settings (id, data) VALUES (1, '{}') ON CONFLICT (id) DO NOTHING;
