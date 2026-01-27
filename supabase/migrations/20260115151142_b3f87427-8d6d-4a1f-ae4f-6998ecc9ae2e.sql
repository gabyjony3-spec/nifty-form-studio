-- Update setup_vip_admins function to include new VIP email
CREATE OR REPLACE FUNCTION public.setup_vip_admins()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
  vip_user_id uuid;
  vip_user_id_2 uuid;
BEGIN
  -- Configurar dsweetwish493@gmail.com como admin
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'dsweetwish493@gmail.com';
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Configurar adp.comunicacao2019@gmail.com com lifetime access
  SELECT id INTO vip_user_id FROM auth.users WHERE email = 'adp.comunicacao2019@gmail.com';
  IF vip_user_id IS NOT NULL THEN
    UPDATE public.profiles SET has_lifetime_access = true WHERE id = vip_user_id;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (vip_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Configurar cadp.comunicacao2019@gmail.com com lifetime access
  SELECT id INTO vip_user_id_2 FROM auth.users WHERE email = 'cadp.comunicacao2019@gmail.com';
  IF vip_user_id_2 IS NOT NULL THEN
    UPDATE public.profiles SET has_lifetime_access = true WHERE id = vip_user_id_2;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (vip_user_id_2, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

-- Also update the trigger function
CREATE OR REPLACE FUNCTION public.check_vip_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IN ('adp.comunicacao2019@gmail.com', 'cadp.comunicacao2019@gmail.com') THEN
    UPDATE public.profiles SET has_lifetime_access = true WHERE id = NEW.id;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Run the function to apply VIP status to existing users
SELECT public.setup_vip_admins();