const jwt = require('jsonwebtoken');

// Middleware untuk verifikasi JWT token
const authenticateToken = (req, res, next) => {
  console.log('🔐 === AUTHENTICATE TOKEN MIDDLEWARE ===');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log(' Path:', req.path);
  console.log(' Method:', req.method);
  console.log(' Origin:', req.headers.origin);
  console.log(' All headers:', req.headers);
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  console.log('🎫 Auth header:', authHeader);
  console.log('�� Token:', token);
  console.log('🔑 JWT_SECRET exists:', !!process.env.JWT_SECRET);

  if (!token) {
    console.log('❌ No token provided - returning 401');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    console.log('⏳ Verifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Token verified successfully');
    console.log('👤 Decoded user data:', decoded);
    
    req.user = decoded;
    console.log('👤 User set in req.user:', req.user);
    
    next();
    console.log('✅ Middleware completed, moving to route handler');
  } catch (error) {
    console.error('❌ === JWT VERIFICATION ERROR ===');
    console.error('🚨 Error name:', error.name);
    console.error('🚨 Error message:', error.message);
    console.error('🚨 Error stack:', error.stack);
    
    if (error.name === 'TokenExpiredError') {
      console.log('⏰ Token expired - returning 401');
      return res.status(401).json({ error: 'Token expired' });
    }
    console.log('🚫 Invalid token - returning 403');
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware untuk verifikasi JWT token (optional - tidak memblokir request)
const optionalAuth = (req, res, next) => {
  console.log('🔓 === OPTIONAL AUTH MIDDLEWARE ===');
  console.log(' Path:', req.path);
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
      console.log('✅ Optional auth: user authenticated');
    } catch (error) {
      console.log('⚠️ Optional auth: token invalid, setting user to null');
      req.user = null;
    }
  } else {
    console.log('ℹ️ Optional auth: no token, setting user to null');
    req.user = null;
  }
  next();
};

// Fungsi untuk generate JWT token
const generateToken = (user) => {
  console.log('�� === GENERATING JWT TOKEN ===');
  console.log('👤 User data:', user);
  
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      username: user.username,
      name: user.name 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
  
  console.log('✅ Token generated successfully');
  return token;
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken
};