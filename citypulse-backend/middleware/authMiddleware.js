const { createClient } = require('@supabase/supabase-js');

// Service-role client — bypasses RLS for admin operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Verify that the incoming request has a valid Supabase JWT.
 * Attaches `req.user` and `req.supabaseUser` on success.
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
    }

    const token = authHeader.split(' ')[1];

    // Use Supabase admin client to verify the JWT
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(500).json({ error: 'Authentication check failed.' });
  }
};

/**
 * Require that the authenticated user has the 'admin' role.
 * Must be used AFTER `verifyToken`.
 */
const requireAdmin = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(403).json({ error: 'Could not verify user role.' });
    }

    if (profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    req.userRole = 'admin';
    next();
  } catch (err) {
    console.error('Admin check error:', err);
    res.status(500).json({ error: 'Role verification failed.' });
  }
};

module.exports = { verifyToken, requireAdmin, supabaseAdmin };
