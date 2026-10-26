import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CORS headers (same as create-dept-head) ─────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

// ─── Secure random password generator ────────────────────────────────────────
// Uses Deno's built-in crypto — no third-party library, runs entirely server-side.
// Output: 12 characters from a mixed alphanumeric + symbol charset.
// Entropy: ~71 bits — sufficient for a one-time temporary credential.
function generateTempPassword(): string {
  const charset =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => charset[b % charset.length])
    .join('');
}

// ─────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // ── 1. Parse body ──────────────────────────────────────────────────────
    const { student_id } = await req.json();

    if (!student_id) {
      return json({ error: 'Missing required field: student_id' }, 400);
    }

    // ── 2. Build admin client (service_role key stays in Deno env only) ────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 3. Authenticate the calling user (dept head's JWT) ─────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return json({ error: 'Unauthorized' }, 401);
    }

    // ── 4. Load caller profile — must be dept_head or admin ───────────────
    const { data: callerProfile, error: callerErr } = await supabaseAdmin
      .from('profiles')
      .select('role, department_id')
      .eq('id', caller.id)
      .single();

    if (callerErr || !callerProfile) {
      return json({ error: 'Could not load caller profile' }, 403);
    }

    const { role: callerRole, department_id: callerDept } = callerProfile;

    if (callerRole !== 'dept_head' && callerRole !== 'admin') {
      return json({ error: 'Forbidden: dept_head or admin access required' }, 403);
    }

    // ── 5. Load target student profile ────────────────────────────────────
    const { data: studentProfile, error: studentErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, department_id, status')
      .eq('id', student_id)
      .single();

    if (studentErr || !studentProfile) {
      return json({ error: 'Student not found' }, 404);
    }

    // ── 6. Authorization checks ────────────────────────────────────────────
    // Must be a student account
    if (studentProfile.role !== 'student') {
      return json({ error: 'Target account is not a student' }, 403);
    }

    // Dept head can only reset passwords for students in their own department.
    // Admins can reset any student.
    if (
      callerRole === 'dept_head' &&
      studentProfile.department_id !== callerDept
    ) {
      return json(
        { error: 'Forbidden: student belongs to a different department' },
        403
      );
    }

    // Cannot reset a deleted or banned account
    if (studentProfile.status === 'deleted') {
      return json({ error: 'Cannot reset password for a deleted account' }, 400);
    }

    // ── 7. Generate temporary password ────────────────────────────────────
    const tempPassword = generateTempPassword();

    // ── 8. Update auth password via Admin API (service-role only) ─────────
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      student_id,
      { password: tempPassword }
    );

    if (updateError) {
      return json({ error: 'Password update failed: ' + updateError.message }, 500);
    }

    // ── 9. Flag account — student must change password on next login ──────
    // Non-fatal: if this fails the password was still reset successfully.
    const { error: flagError } = await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', student_id);

    if (flagError) {
      console.error('Failed to set must_change_password flag:', flagError.message);
    }

    // ── 10. Log the action in approval_log ────────────────────────────────
    await supabaseAdmin.from('approval_log').insert({
      student_id,
      action:   'password_reset',
      reason:   'Password reset by department head',
      actor_id: caller.id,
    });

    // ── 10. Return temp password — shown once, never stored ───────────────
    return json({
      success:       true,
      temp_password: tempPassword,
      student_name:  studentProfile.full_name,
      message:       'Password reset successfully. Share this temporary password with the student securely.',
    });

  } catch (err) {
    return json({ error: err.message }, 500);
  }
});
