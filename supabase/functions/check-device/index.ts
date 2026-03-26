import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                     req.headers.get('x-real-ip') ||
                     'unknown';

    if (req.method === 'POST') {
      const { userId } = await req.json();

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Missing userId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: existing } = await supabase
        .from('device_registrations')
        .select('user_id')
        .eq('ip_address', clientIp)
        .maybeSingle();

      if (existing && existing.user_id !== userId) {
        return new Response(
          JSON.stringify({ allowed: false, message: 'This device is already registered to another account' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!existing) {
        await supabase.from('device_registrations').insert({
          ip_address: clientIp,
          user_id: userId
        });
      } else {
        await supabase
          .from('device_registrations')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('ip_address', clientIp);
      }

      return new Response(
        JSON.stringify({ allowed: true, ip: clientIp }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      const { data: existing } = await supabase
        .from('device_registrations')
        .select('user_id')
        .eq('ip_address', clientIp)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          registered: !!existing,
          ip: clientIp
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
