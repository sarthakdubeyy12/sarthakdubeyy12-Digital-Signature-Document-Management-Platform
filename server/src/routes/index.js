const express = require('express');

const router = express.Router();

// Welcome route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Digital Signature & Document Management Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      documents: '/api/v1/documents',
      signatures: '/api/v1/signatures',
      verification: '/api/v1/verification',
      audit: '/api/v1/audit',
      admin: '/api/v1/admin',
    },
  });
});

// Module routes will be added here
// router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/documents', documentRoutes);
// router.use('/signatures', signatureRoutes);
// router.use('/verification', verificationRoutes);
// router.use('/audit', auditRoutes);
// router.use('/admin', adminRoutes);

module.exports = router;
