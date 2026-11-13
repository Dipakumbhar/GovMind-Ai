const windows = new Map();

function rateLimit({ windowMs, max, message }) {
  return (req, res, next) => {
    const now = Date.now();
    const routePath = req.route?.path || req.path;
    const key = `${req.ip || req.socket?.remoteAddress || 'unknown'}:${req.baseUrl}${routePath}`;
    let entry = windows.get(key);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      windows.set(key, entry);
    }

    entry.count += 1;
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      return res.status(429).json({ message });
    }

    // Keep this small process-local limiter bounded during long-running sessions.
    if (windows.size > 5000) {
      for (const [windowKey, window] of windows) {
        if (now >= window.resetAt) windows.delete(windowKey);
      }
    }

    return next();
  };
}

module.exports = rateLimit;
