// // server/routes/orders.js
// const express = require('express');
// const router = express.Router();
// const Order = require('../models/Order');
// const Message = require('../models/Message');
// const Notification = require('../models/Notification');
// const { protect } = require('../middleware/auth');
// const upload = require('../utils/fileUpload');
// const aws = require('aws-sdk');
// const s3 = new aws.S3();

// // @route   GET /api/v1/orders
// // @desc    Get all orders for current customer
// // @access  Private
// router.get('/', protect, async (req, res) => {
//   try {
//     const orders = await Order.find({ customerId: req.user._id })
//       .sort({ createdAt: -1 });
    
//     res.status(200).json({
//       success: true,
//       orders: orders.map(order => ({
//         id: order._id,
//         orderNumber: order.orderNumber,
//         status: order.status,
//         createdAt: order.createdAt,
//       })),
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// // @route   GET /api/v1/orders/:id
// // @desc    Get specific order details
// // @access  Private
// router.get('/:id', protect, async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);
    
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found',
//       });
//     }
    
//     // Check if customer owns the order
//     if (order.customerId.toString() !== req.user._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not authorized to access this order',
//       });
//     }
    
//     // Get messages for this order
//     const messages = await Message.find({ orderId: order._id })
//       .sort({ createdAt: 1 })
//       .populate('senderId', 'name role');
    
//     // Format messages
//     const formattedMessages = messages.map(message => ({
//       id: message._id,
//       sender: {
//         id: message.senderId._id,
//         name: message.senderId.role === 'admin' ? 'Vee4 Admin' : message.senderId.name,
//       },
//       content: message.content,
//       createdAt: message.createdAt,
//     }));
    
//     // Prepare progress steps based on status
//     const progressSteps = [
//       { step: 1, name: 'Order Received', completed: true },
//       { step: 2, name: 'Approved', completed: order.status !== 'pending' && order.status !== 'rejected' },
//       { step: 3, name: 'Material Prep', completed: ['material_prep', 'fabrication', 'powder_coating', 'quality_check', 'packaging', 'delivered', 'completed'].includes(order.status) },
//       { step: 4, name: 'Fabrication', completed: ['fabrication', 'powder_coating', 'quality_check', 'packaging', 'delivered', 'completed'].includes(order.status) },
//       { step: 5, name: 'Powder Coating', completed: ['powder_coating', 'quality_check', 'packaging', 'delivered', 'completed'].includes(order.status) },
//       { step: 6, name: 'Quality Check', completed: ['quality_check', 'packaging', 'delivered', 'completed'].includes(order.status) },
//       { step: 7, name: 'Packaging', completed: ['packaging', 'delivered', 'completed'].includes(order.status) },
//       { step: 8, name: 'Delivered', completed: ['delivered', 'completed'].includes(order.status) },
//     ];
    
//     // Determine current step
//     let currentStep = 1;
//     if (order.status === 'approved') currentStep = 2;
//     else if (order.status === 'material_prep') currentStep = 3;
//     else if (order.status === 'fabrication') currentStep = 4;
//     else if (order.status === 'powder_coating') currentStep = 5;
//     else if (order.status === 'quality_check') currentStep = 6;
//     else if (order.status === 'packaging') currentStep = 7;
//     else if (['delivered', 'completed'].includes(order.status)) currentStep = 8;
    
//     res.status(200).json({
//       success: true,
//       order: {
//         id: order._id,
//         orderNumber: order.orderNumber,
//         status: order.status,
//         createdAt: order.createdAt,
//         productType: order.productType,
//         metalType: order.metalType,
//         thickness: order.thickness,
//         width: order.width,
//         height: order.height,
//         quantity: order.quantity,
//         color: order.color,
//         additionalRequirements: order.additionalRequirements,
//         designFile: order.designFile,
//         testReport: order.testReport,
//         invoice: order.invoice,
//         messages: formattedMessages,
//         progress: {
//           currentStep,
//           steps: progressSteps,
//         },
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// // @route   POST /api/v1/orders
// // @desc    Place a new order
// // @access  Private
// router.post('/', protect, upload.single('designFile'), async (req, res) => {
//   try {
//     const {
//       productType,
//       metalType,
//       thickness,
//       width,
//       height,
//       quantity,
//       color,
//       additionalRequirements,
//     } = req.body;
    
//     // Check if file was uploaded
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please upload a design file',
//       });
//     }
    
//     // Create new order
//     const order = await Order.create({
//       customerId: req.user._id,
//       productType,
//       metalType,
//       thickness,
//       width,
//       height,
//       quantity,
//       color,
//       additionalRequirements,
//       designFile: req.file.location, // S3 URL
//     });
    
//     // Create a welcome message from admin
//     await Message.create({
//       orderId: order._id,
//       senderId: req.user._id, // This will be replaced with an admin ID in a real system
//       content: 'Thank you for your order. We are currently reviewing your specifications and will update you soon.',
//     });
    
//     // Create a notification for admin
//     // In a real system, you would have a designated admin ID
//     // For now, we'll skip this step
    
//     res.status(201).json({
//       success: true,
//       order: {
//         id: order._id,
//         orderNumber: order.orderNumber,
//         status: order.status,
//         createdAt: order.createdAt,
//       },
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// // @route   POST /api/v1/orders/:id/messages
// // @desc    Send a message about a specific order
// // @access  Private
// router.post('/:id/messages', protect, async (req, res) => {
//   try {
//     const { content } = req.body;
    
//     // Check if order exists
//     const order = await Order.findById(req.params.id);
    
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found',
//       });
//     }
    
//     // Check if customer owns the order
//     if (order.customerId.toString() !== req.user._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not authorized to access this order',
//       });
//     }
    
//     // Create message
//     const message = await Message.create({
//       orderId: order._id,
//       senderId: req.user._id,
//       content,
//     });
    
//     // Create notification for admin
//     // In a real system, you would have a designated admin ID
//     // For now, we'll skip this step
    
//     res.status(201).json({
//       success: true,
//       message: {
//         id: message._id,
//         content: message.content,
//         createdAt: message.createdAt,
//       },
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// // @route   GET /api/v1/orders/:id/documents/:documentType
// // @desc    Download document for a specific order
// // @access  Private
// router.get('/:id/documents/:documentType', protect, async (req, res) => {
//   try {
//     const { id, documentType } = req.params;
    
//     // Check if order exists
//     const order = await Order.findById(id);
    
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found',
//       });
//     }
    
//     // Check if customer owns the order
//     if (order.customerId.toString() !== req.user._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not authorized to access this order',
//       });
//     }
    
//     // Get document URL based on type
//     let documentUrl;
//     if (documentType === 'design') {
//       documentUrl = order.designFile;
//     } else if (documentType === 'test-report') {
//       documentUrl = order.testReport;
//     } else if (documentType === 'invoice') {
//       documentUrl = order.invoice;
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid document type',
//       });
//     }
    
//     if (!documentUrl) {
//       return res.status(404).json({
//         success: false,
//         message: 'Document not found',
//       });
//     }
    
//     // Extract the key from the S3 URL
//     const key = documentUrl.split('.com/')[1];
    
//     // Get the document from S3
//     const params = {
//       Bucket: process.env.AWS_S3_BUCKET_NAME,
//       Key: key,
//     };
    
//     const s3Object = await s3.getObject(params).promise();
    
//     // Set the appropriate headers
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=${documentType}-${order.orderNumber}.pdf`);
    
//     // Send the file
//     res.send(s3Object.Body);
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// module.exports = router;


// server/routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { upload, addLocationToFile } = require('../utils/fileUpload');
const path = require('path');
const fs = require('fs');

// @route   GET /api/v1/orders
// @desc    Get all orders for current customer
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      orders: orders.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/v1/orders/:id
// @desc    Get specific order details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    // Check if customer owns the order
    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order',
      });
    }
    
    // Get messages for this order
    const messages = await Message.find({ orderId: order._id })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name role');
    
    // Format messages
    const formattedMessages = messages.map(message => ({
      id: message._id,
      sender: {
        id: message.senderId._id,
        name: message.senderId.role === 'admin' ? 'Vee4 Admin' : message.senderId.name,
      },
      content: message.content,
      createdAt: message.createdAt,
    }));
    
    // Prepare progress steps based on status
    const progressSteps = [
      { step: 1, name: 'Order Received', completed: true },
      { step: 2, name: 'Approved', completed: order.status !== 'pending' && order.status !== 'rejected' },
      { step: 3, name: 'Material Prep', completed: ['material_prep', 'fabrication', 'powder_coating', 'quality_check', 'packaging', 'delivered', 'completed'].includes(order.status) },
      { step: 4, name: 'Fabrication', completed: ['fabrication', 'powder_coating', 'quality_check', 'packaging', 'delivered', 'completed'].includes(order.status) },
      { step: 5, name: 'Powder Coating', completed: ['powder_coating', 'quality_check', 'packaging', 'delivered', 'completed'].includes(order.status) },
      { step: 6, name: 'Quality Check', completed: ['quality_check', 'packaging', 'delivered', 'completed'].includes(order.status) },
      { step: 7, name: 'Packaging', completed: ['packaging', 'delivered', 'completed'].includes(order.status) },
      { step: 8, name: 'Delivered', completed: ['delivered', 'completed'].includes(order.status) },
    ];
    
    // Determine current step
    let currentStep = 1;
    if (order.status === 'approved') currentStep = 2;
    else if (order.status === 'material_prep') currentStep = 3;
    else if (order.status === 'fabrication') currentStep = 4;
    else if (order.status === 'powder_coating') currentStep = 5;
    else if (order.status === 'quality_check') currentStep = 6;
    else if (order.status === 'packaging') currentStep = 7;
    else if (['delivered', 'completed'].includes(order.status)) currentStep = 8;
    
    res.status(200).json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        productType: order.productType,
        metalType: order.metalType,
        thickness: order.thickness,
        width: order.width,
        height: order.height,
        quantity: order.quantity,
        color: order.color,
        additionalRequirements: order.additionalRequirements,
        designFile: order.designFile,
        testReport: order.testReport,
        invoice: order.invoice,
        messages: formattedMessages,
        progress: {
          currentStep,
          steps: progressSteps,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/v1/orders
// @desc    Place a new order
// @access  Private
router.post('/', protect, upload.single('designFile'), async (req, res) => {
  try {
    const {
      productType,
      metalType,
      thickness,
      width,
      height,
      quantity,
      color,
      additionalRequirements,
    } = req.body;
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a design file',
      });
    }
    
    // Create new order
    const order = await Order.create({
      customerId: req.user._id,
      productType,
      metalType,
      thickness,
      width,
      height,
      quantity,
      color,
      additionalRequirements,
      designFile: req.file.location, // URL from our middleware
    });
    
    // Create a welcome message from admin
    await Message.create({
      orderId: order._id,
      senderId: req.user._id, // This will be replaced with an admin ID in a real system
      content: 'Thank you for your order. We are currently reviewing your specifications and will update you soon.',
    });
    
    // Create a notification for admin
    // In a real system, you would have a designated admin ID
    // For now, we'll skip this step
    
    res.status(201).json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/v1/orders/:id/messages
// @desc    Send a message about a specific order
// @access  Private
router.post('/:id/messages', protect, async (req, res) => {
  try {
    const { content } = req.body;
    
    // Check if order exists
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    // Check if customer owns the order
    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order',
      });
    }
    
    // Create message
    const message = await Message.create({
      orderId: order._id,
      senderId: req.user._id,
      content,
    });
    
    // Create notification for admin
    // In a real system, you would have a designated admin ID
    // For now, we'll skip this step
    
    res.status(201).json({
      success: true,
      message: {
        id: message._id,
        content: message.content,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/v1/orders/:id/documents/:documentType
// @desc    Download document for a specific order
// @access  Private
router.get('/:id/documents/:documentType', protect, async (req, res) => {
  try {
    const { id, documentType } = req.params;
    
    // Check if order exists
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    // Check if customer owns the order
    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order',
      });
    }
    
    // Get document URL based on type
    let documentUrl;
    if (documentType === 'design') {
      documentUrl = order.designFile;
    } else if (documentType === 'test-report') {
      documentUrl = order.testReport;
    } else if (documentType === 'invoice') {
      documentUrl = order.invoice;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type',
      });
    }
    
    if (!documentUrl) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }
    
    // For local file system:
    // Extract the file path from the URL
    // URL format: http://host/uploads/userId/filename.pdf
    const urlParts = documentUrl.split('/uploads/');
    if (urlParts.length < 2) {
      return res.status(404).json({
        success: false,
        message: 'Document path invalid',
      });
    }
    
    const relativePath = urlParts[1]; // userId/filename.pdf
    const filePath = path.join(__dirname, '../uploads', relativePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Document file not found',
      });
    }
    
    // Set the appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${documentType}-${order.orderNumber}.pdf`);
    
    // Send the file
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;