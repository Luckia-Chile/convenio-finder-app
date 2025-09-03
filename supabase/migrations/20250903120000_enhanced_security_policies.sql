-- 🔐 ENHANCED SECURITY POLICIES
-- Adding server-side role validation and stricter access controls

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Enhanced policies for beneficiarios table with role-based access

-- Drop existing policies to replace with more secure ones
DROP POLICY IF EXISTS "Users can view beneficiarios" ON public.beneficiarios;
DROP POLICY IF EXISTS "Users can insert beneficiarios" ON public.beneficiarios;
DROP POLICY IF EXISTS "Users can delete beneficiarios" ON public.beneficiarios;
DROP POLICY IF EXISTS "Users can update beneficiarios" ON public.beneficiarios;

-- All authenticated users can view beneficiarios (search functionality)
CREATE POLICY "Authenticated users can view beneficiarios"
ON public.beneficiarios
FOR SELECT
USING (auth.role() = 'authenticated');

-- Only admins can insert beneficiarios (file upload)
CREATE POLICY "Only admins can insert beneficiarios"
ON public.beneficiarios
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  public.is_admin()
);

-- Only admins can delete beneficiarios (clear data)
CREATE POLICY "Only admins can delete beneficiarios"
ON public.beneficiarios
FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  public.is_admin()
);

-- Only admins can update beneficiarios (rare case, but secure)
CREATE POLICY "Only admins can update beneficiarios"
ON public.beneficiarios
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  public.is_admin()
)
WITH CHECK (
  auth.role() = 'authenticated' AND
  public.is_admin()
);

-- Enhanced clear_beneficiarios_data function with admin check
CREATE OR REPLACE FUNCTION public.clear_beneficiarios_data()
RETURNS void AS $$
BEGIN
  -- Check if user is admin before proceeding
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Truncate is more efficient than DELETE for clearing all data
  TRUNCATE TABLE public.beneficiarios RESTART IDENTITY;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_logs
FOR SELECT
USING (public.is_admin());

-- System can insert audit logs (via triggers)
CREATE POLICY "System can insert audit logs"
ON public.security_audit_logs
FOR INSERT
WITH CHECK (true);

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  action_name TEXT,
  table_name_param TEXT DEFAULT NULL,
  details_param JSONB DEFAULT NULL,
  success_param BOOLEAN DEFAULT true
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    table_name,
    details,
    success
  ) VALUES (
    auth.uid(),
    action_name,
    table_name_param,
    details_param,
    success_param
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the main operation if logging fails
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.log_security_event(TEXT, TEXT, JSONB, BOOLEAN) TO authenticated;

-- Create trigger function for beneficiarios audit
CREATE OR REPLACE FUNCTION public.audit_beneficiarios_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(
      'DELETE_BENEFICIARIOS',
      'beneficiarios',
      jsonb_build_object('deleted_count', 1)
    );
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      'INSERT_BENEFICIARIOS',
      'beneficiarios',
      jsonb_build_object('inserted_count', 1)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers
CREATE TRIGGER audit_beneficiarios_changes
  AFTER INSERT OR DELETE ON public.beneficiarios
  FOR EACH ROW EXECUTE FUNCTION public.audit_beneficiarios_changes();

-- Add comments for documentation
COMMENT ON FUNCTION public.is_admin() IS 'Checks if current authenticated user has admin role';
COMMENT ON FUNCTION public.log_security_event(TEXT, TEXT, JSONB, BOOLEAN) IS 'Logs security-related events for audit trail';
COMMENT ON TABLE public.security_audit_logs IS 'Audit trail for security-sensitive operations';

-- Create indexes for performance
CREATE INDEX idx_security_audit_logs_user_id ON public.security_audit_logs(user_id);
CREATE INDEX idx_security_audit_logs_action ON public.security_audit_logs(action);
CREATE INDEX idx_security_audit_logs_created_at ON public.security_audit_logs(created_at DESC);