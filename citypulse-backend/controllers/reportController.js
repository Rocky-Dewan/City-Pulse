const { supabaseAdmin } = require('../middleware/authMiddleware');

// ── POST /api/reports ─────────────────────────────────────────────────────────
// BUG FIX (Task 1): Added location_text to accepted payload.
// Removed the requirement for latitude/longitude when location_text is provided.
// Validates that at least ONE location type is supplied.
const createReport = async (req, res) => {
  try {
    const { title, description, category, image_url, latitude, longitude, location_text } = req.body;
    const userId = req.user.id;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Missing required fields: title, description, category.' });
    }

    const hasGps    = latitude  != null && longitude != null;
    const hasManual = typeof location_text === 'string' && location_text.trim().length > 0;

    if (!hasGps && !hasManual) {
      return res.status(400).json({ error: 'A location is required (GPS coordinates or text address).' });
    }

    if (hasGps) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return res.status(400).json({ error: 'Invalid latitude/longitude values.' });
      }
    }

    // ── Spam check: max 5 reports per hour per user ────────────────────────────
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count }  = await supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo);

    if (count >= 5) {
      return res.status(429).json({ error: 'Rate limit: maximum 5 reports per hour.' });
    }

    // ── Insert ─────────────────────────────────────────────────────────────────
    const payload = {
      user_id:       userId,
      title:         title.trim(),
      description:   description.trim(),
      category,
      image_url:     image_url || null,
      location_text: hasManual ? location_text.trim() : null,
    };

    if (hasGps) {
      payload.latitude  = parseFloat(latitude);
      payload.longitude = parseFloat(longitude);
    }

    const { data, error } = await supabaseAdmin
      .from('reports')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return res.status(500).json({ error: error.message || 'Failed to create report.' });
    }

    res.status(201).json({ message: 'Report created successfully.', report: data });
  } catch (err) {
    console.error('createReport error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── PUT /api/reports/:id/upvote ───────────────────────────────────────────────
// BUG FIX (Task 1): Use .maybeSingle() instead of .single() to prevent
// PostgREST from throwing PGRST116 when no upvote row exists yet.
const toggleUpvote = async (req, res) => {
  try {
    const { id: reportId } = req.params;
    const userId = req.user.id;

    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .select('id, upvotes')
      .eq('id', reportId)
      .maybeSingle();                       // ← FIX: was .single()

    if (reportError || !report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    // Check for existing upvote — maybeSingle() returns null (not error) if missing
    const { data: existingUpvote } = await supabaseAdmin
      .from('upvotes')
      .select('id')
      .eq('user_id', userId)
      .eq('report_id', reportId)
      .maybeSingle();                       // ← FIX: was .single()

    let action;

    if (existingUpvote) {
      await supabaseAdmin.from('upvotes').delete().eq('user_id', userId).eq('report_id', reportId);
      action = 'removed';
    } else {
      await supabaseAdmin.from('upvotes').insert({ user_id: userId, report_id: reportId });
      action = 'added';
    }

    const { data: updated, error: updateError } = await supabaseAdmin.rpc('increment_upvotes', {
      report_id: reportId,
      delta: existingUpvote ? -1 : 1,
    });

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update upvote count.' });
    }

    res.json({ message: `Upvote ${action}.`, upvotes: updated, userUpvoted: action === 'added' });
  } catch (err) {
    console.error('toggleUpvote error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── PUT /api/reports/:id/status ── ADMIN ONLY ─────────────────────────────────
// Note: The DB trigger award_points_on_resolve fires automatically when status
// changes to 'resolved', awarding +100 pts to the reporter. No backend logic needed.
const updateStatus = async (req, res) => {
  try {
    const { id: reportId } = req.params;
    const { status }       = req.body;

    const validStatuses = ['pending', 'in_progress', 'resolved'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const { data, error } = await supabaseAdmin
      .from('reports')
      .update({ status })
      .eq('id', reportId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Status update error:', error);
      return res.status(500).json({ error: 'Failed to update report status.' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    res.json({ message: `Status updated to "${status}".`, report: data });
  } catch (err) {
    console.error('updateStatus error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── GET /api/reports ──────────────────────────────────────────────────────────
// TASK 5: Join includes profiles.points and profiles.badge
const getTopReports = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabaseAdmin
      .from('reports')
      .select('*, profiles(id, username, full_name, avatar_url, points, badge)', { count: 'exact' })
      .order('upvotes',    { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch reports.' });
    }

    res.json({
      reports:    data,
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    console.error('getTopReports error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { createReport, toggleUpvote, updateStatus, getTopReports };
