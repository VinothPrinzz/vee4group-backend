// // server/routes/admin.js
// const express = require('express');
// const router = express.Router();
// const Order = require('../models/Order');
// const User = require('../models/User');
// const Message = require('../models/Message');
// const Notification = require('../models/Notification');
// const { protect, isAdmin } = require('../middleware/auth');
// const upload = require('../utils/fileUpload');

// // @route   GET /api/v1/admin/orders
// // @desc    Get all orders (with filtering options)
// // @access  Private/Admin
// router.get('/orders', protect, isAdmin, async (req, res) => {
//   try {
//     const { status, customer, startDate, endDate } = req.query;
    
//     // Build filter object
//     const filter = {};
    
//     if (status) {
//       filter.status = status;
//     }
    
//     if (startDate && endDate) {
//       filter.createdAt = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate),
//       };
//     } else if (startDate) {
//       filter.createdAt = { $gte: new Date(startDate) };
//     } else if (endDate) {
//       filter.createdAt = { $lte: new Date(endDate) };
//     }
    
//     // If customer name is provided, find matching customers first
//     if (customer) {
//       const customers = await User.find({
//         $or: [
//           { name: { $regex: customer, $options: 'i' } },
//           { company: { $regex: customer, $options: 'i' } },
//         ],
//         role: 'customer',
//       });
      
//       if (customers.length > 0) {
//         filter.customerId = { $in: customers.map(c => c._id) };
//       } else {
//         // No matching customers found, return empty result
//         return res.status(200).json({
//           success: true,
//           orders: [],
//         });
//       }
//     }
    
//     // Find orders with populated customer data
//     const orders = await Order.find(filter)
//       .sort({ createdAt: -1 })
//       .populate('customerId', 'name company');
    
//     // Format the response
//     const formattedOrders = orders.map(order => ({
//       id: order._id,
//       orderNumber: order.orderNumber,
//       customer: {
//         id: order.customerId._id,
//         name: order.customerId.name,
//         company: order.customerId.company,
//       },
//       status: order.status,
//       createdAt: order.createdAt,
//     }));
    
//     res.status(200).json({
//       success: true,
//       orders: formattedOrders,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// // @route   GET /api/v1/admin/orders/:id
// // @desc    Get specific order details (admin view)
// // @access  Private/Admin
// router.get('/orders/:id', protect, isAdmin, async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id)
//       .populate('customerId', 'name company email phone');
    
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found',
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
    
//     res.status(200).json({
//       success: true,
//       order: {
//         id: order._id,
//         orderNumber: order.orderNumber,
//         customer: {
//           id: order.customerId._id,
//           name: order.customerId.name,
//           company: order.customerId.company,
//           email: order.customerId.email,
//           phone: order.customerId.phone,
//         },
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
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// // @route   PUT /api/v1/admin/orders/:id/status
// // @desc    Update order status
// // @access  Private/Admin
// router.put('/orders/:id/status', protect, isAdmin, async (req, res) => {
//   try {
//     const { status, notifyCustomer, message } = req.body;
    
//     // Check if status is valid
//     const validStatuses = [
//       'pending',
//       'approved',
//       'rejected',
//       'material_prep',
//       'fabrication',
//       'powder_coating',
//       'quality_check',
//       'packaging',
//       'delivered',
//       'completed',
//     ];
    
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid status',
//       });
//     }
    
//     // Find the order
//     const order = await Order.findById(req.params.id);
    
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found',
//       });
//     }
    
//     // Update the status
//     order.status = status;
//     await order.save();
    
//     // If notification is requested and message is provided
//     if (notifyCustomer && message) {
//       // Create a message from admin
//       await Message.create({
//         orderId: order._id,
//         senderId: req.user._id,
//         content: message,
//       });
      
//       // Create a notification for the customer
//       await Notification.create({
//         userId: order.customerId,
//         title: 'Order Status Updated',
//         message: `Your order #${order.orderNumber} status has been updated to '${status}'`,
//         type: 'order_status',
//         orderId: order._id,
//       });
      
//       // In a real system, you would also send an email to the customer
//     }
    
//     res.status(200).json({
//       success: true,
//       order: {
//         id: order._id,
//         orderNumber: order.orderNumber,
//         status: order.status,
//         updatedAt: order.updatedAt,
//       },
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// // @route   PUT /api/v1/admin/orders/:id/approve
// // @desc    Approve an order
// // @access  Private/Admin
// router.put('/orders/:id/approve', protect, isAdmin, async (req, res) => {
//   try {
//     const { notifyCustomer, message } = req.body;
    
//     // Find the order
//     const order = await Order.findById(req.params.id);
    
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found',
//       });
//     }
    
//     // Check if order is in pending status
//     if (order.status !== 'pending') {
//       return res.status(400).json({
//         success: false,
//         message: 'Order can only be approved when in pending status',
//       });
//     }
    
//     // Update the status
//     order.status = 'approved';
//     await order.save();
    
//     // If notification is requested
//     if (notifyCustomer) {
//       const messageContent = message || 'Your order has been approved and will move to production shortly.';
      
//       // Create a message from admin
//       await Message.create({
//         orderId: order._id,
//         senderId: req.user._id,
//         content: messageContent,
//       });
      
//       // Create a notification for the customer
//       await Notification.create({
//         userId: order.customerId,
//         title: 'Order Approved',
//         message: `Your order #${order.orderNumber} has been approved`,
//         type: 'order_status',
//         orderId: order._id,
//       });
      
//       // In a real system, you would also send an email to the customer
//     }
    
//     res.status(200).json({
//       success: true,
//       order: {
//         id: order._id,
//         orderNumber: order.orderNumber,
//         status: order.status,
//         updatedAt: order.updatedAt,
//       },
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// // @route   PUT /api/v1/admin/orders/:id/reject
// // @desc    Reject an order
// // @access  Private/Admin
// router.put('/orders/:id/reject', protect, isAdmin, async (req, res) => {
//   try {
//     const { notifyCustomer, message } = req.body;
    
//     // Find the order
//     const order = await Order.findById(req.params.id);
    
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found',
//       });
//     }
    
//     // Check if order is in pending status
//     if (order.status !== 'pending') {
//       return res.status(400).json({
//         success: false,
//         message: 'Order can only be rejected when in pending status',
//       });
//     }
    
//     // Update the status
//     order.status = 'rejected';
//     await order.save();
    
//     // If notification is requested
//     if (notifyCustomer) {
//       const messageContent = message || 'Your order has been rejected. Please contact us for more information.';
      
//       // Create a message from admin
//       await Message.create({
//         orderId: order._id,
//         senderId: req.user._id,
//         content: messageContent,
//       });
      
//       // Create a notification for the customer
//       await Notification.create({
//         userId: order.customerId,
//         title: 'Order Rejected',
//         message: `Your order #${order.orderNumber} has been rejected`,
//         type: 'order_status',
//         orderId: order._id,
//       });
      
//       // In a real system, you would also send an email to the customer
//     }
    
//     res.status(200).json({
//       success: true,
//       order: {
//         id: order._id,
//         orderNumber: order.orderNumber,
//         status: order.status,
//         updatedAt: order.updatedAt,
//       },
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: "sorry something went wrong",
//     })
//   }
// })

// // @route   POST /api/v1/admin/orders/:id/messages
// // @desc    Send a message to customer about an order
// // @access  Private/Admin
// router.post('/orders/:id/messages', protect, isAdmin, async (req, res) => {
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
    
//     // Create message
//     const message = await Message.create({
//       orderId: order._id,
//       senderId: req.user._id,
//       content,
//     });
    
//     // Create notification for customer
//     await Notification.create({
//       userId: order.customerId,
//       title: 'New Message',
//       message: `Admin has sent you a message regarding order #${order.orderNumber}`,
//       type: 'message',
//       orderId: order._id,
//     });
    
//     // In a real system, you would also send an email to the customer
    
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

// // @route   POST /api/v1/admin/orders/:id/documents/:documentType
// // @desc    Upload test reports or invoices for an order
// // @access  Private/Admin
// router.post('/orders/:id/documents/:documentType', protect, isAdmin, upload.single('file'), async (req, res) => {
//   try {
//     const { id, documentType } = req.params;
//     const { notifyCustomer } = req.body;
    
//     // Check if document type is valid
//     if (!['test-report', 'invoice'].includes(documentType)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid document type',
//       });
//     }
    
//     // Check if file was uploaded
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please upload a file',
//       });
//     }
    
//     // Find the order
//     const order = await Order.findById(id);
    
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found',
//       });
//     }
    
//     // Update the order with the document URL
//     if (documentType === 'test-report') {
//       order.testReport = req.file.location;
//     } else if (documentType === 'invoice') {
//       order.invoice = req.file.location;
//     }
    
//     await order.save();
    
//     // If notification is requested
//     if (notifyCustomer === 'true' || notifyCustomer === true) {
//       // Create a message from admin
//       await Message.create({
//         orderId: order._id,
//         senderId: req.user._id,
//         content: `A new ${documentType === 'test-report' ? 'test report' : 'invoice'} has been uploaded for your order.`,
//       });
      
//       // Create a notification for the customer
//       await Notification.create({
//         userId: order.customerId,
//         title: `New ${documentType === 'test-report' ? 'Test Report' : 'Invoice'} Available`,
//         message: `A new ${documentType === 'test-report' ? 'test report' : 'invoice'} is available for your order #${order.orderNumber}`,
//         type: 'order_status',
//         orderId: order._id,
//       });
      
//       // In a real system, you would also send an email to the customer
//     }
    
//     res.status(201).json({
//       success: true,
//       document: {
//         type: documentType,
//         url: req.file.location,
//         uploadedAt: new Date(),
//       },
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// // @route   GET /api/v1/admin/customers
// // @desc    Get list of all customers
// // @access  Private/Admin
// router.get('/customers', protect, isAdmin, async (req, res) => {
//   try {
//     // Find all customers
//     const customers = await User.find({ role: 'customer' }).sort({ createdAt: -1 });
    
//     // Get order counts for each customer
//     const customerData = await Promise.all(
//       customers.map(async (customer) => {
//         const ordersCount = await Order.countDocuments({ customerId: customer._id });
        
//         return {
//           id: customer._id,
//           name: customer.name,
//           email: customer.email,
//           company: customer.company,
//           phone: customer.phone,
//           ordersCount,
//           createdAt: customer.createdAt,
//         };
//       })
//     );
    
//     res.status(200).json({
//       success: true,
//       customers: customerData,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// module.exports = router;


// server/routes/admin.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { protect, isAdmin } = require('../middleware/auth');
const { upload, addLocationToFile } = require('../utils/fileUpload');
const path = require('path');
const fs = require('fs');

// @route   GET /api/v1/admin/orders
// @desc    Get all orders (with filtering options)
// @access  Private/Admin
router.get('/orders', protect, isAdmin, async (req, res) => {
  try {
    const { status, customer, startDate, endDate } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      filter.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.createdAt = { $lte: new Date(endDate) };
    }
    
    // If customer name is provided, find matching customers first
    if (customer) {
      const customers = await User.find({
        $or: [
          { name: { $regex: customer, $options: 'i' } },
          { company: { $regex: customer, $options: 'i' } },
        ],
        role: 'customer',
      });
      
      if (customers.length > 0) {
        filter.customerId = { $in: customers.map(c => c._id) };
      } else {
        // No matching customers found, return empty result
        return res.status(200).json({
          success: true,
          orders: [],
        });
      }
    }
    
    // Find orders with populated customer data
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('customerId', 'name company');
    
    // Format the response
    const formattedOrders = orders.map(order => ({
      id: order._id,
      orderNumber: order.orderNumber,
      customer: {
        id: order.customerId._id,
        name: order.customerId.name,
        company: order.customerId.company,
      },
      status: order.status,
      createdAt: order.createdAt,
    }));
    
    res.status(200).json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/v1/admin/orders/:id
// @desc    Get specific order details (admin view)
// @access  Private/Admin
router.get('/orders/:id', protect, isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name company email phone');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
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
    
    res.status(200).json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        customer: {
          id: order.customerId._id,
          name: order.customerId.name,
          company: order.customerId.company,
          email: order.customerId.email,
          phone: order.customerId.phone,
        },
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
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/v1/admin/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/orders/:id/status', protect, isAdmin, async (req, res) => {
  try {
    const { status, notifyCustomer, message, expectedDeliveryDate } = req.body;
    
    // Check if status is valid
    const validStatuses = [
      'pending',
      'approved',
      'rejected',
      'material_prep',
      'fabrication',
      'powder_coating',
      'quality_check',
      'packaging',
      'delivered',
      'completed',
    ];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }
    
    // Find the order
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    // Update the status
    order.status = status;
    
    // Update expected delivery date if provided
    if (expectedDeliveryDate) {
      order.expectedDeliveryDate = new Date(expectedDeliveryDate);
    }
    
    await order.save();
    
    // If notification is requested and message is provided
    if (notifyCustomer && message) {
      // Create a message from admin
      await Message.create({
        orderId: order._id,
        senderId: req.user._id,
        content: message,
      });
      
      // Prepare notification message with delivery date if available
      let notificationMessage = `Your order #${order.orderNumber} status has been updated to '${status}'`;
      
      if (order.expectedDeliveryDate) {
        const formattedDate = new Date(order.expectedDeliveryDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        notificationMessage += ` with expected delivery on ${formattedDate}`;
      }
      
      // Create a notification for the customer
      await Notification.create({
        userId: order.customerId,
        title: 'Order Status Updated',
        message: notificationMessage,
        type: 'order_status',
        orderId: order._id,
      });
    }
    
    res.status(200).json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        expectedDeliveryDate: order.expectedDeliveryDate,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/v1/admin/orders/:id/approve
// @desc    Approve an order
// @access  Private/Admin
router.put('/orders/:id/approve', protect, isAdmin, async (req, res) => {
  try {
    const { notifyCustomer, message, expectedDeliveryDate } = req.body;
    
    // Find the order
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    // Check if order is in pending status
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order can only be approved when in pending status',
      });
    }
    
    // Update the status and expected delivery date
    order.status = 'approved';
    
    // Set expected delivery date if provided, otherwise calculate a default (14 days from now)
    if (expectedDeliveryDate) {
      order.expectedDeliveryDate = new Date(expectedDeliveryDate);
    } else {
      const defaultDeliveryDate = new Date();
      defaultDeliveryDate.setDate(defaultDeliveryDate.getDate() + 14); // Default: 14 days
      order.expectedDeliveryDate = defaultDeliveryDate;
    }
    
    await order.save();
    
    // If notification is requested
    if (notifyCustomer) {
      const formattedDate = order.expectedDeliveryDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const messageContent = message || 
        `Your order has been approved and will move to production shortly. Expected delivery date: ${formattedDate}.`;
      
      // Create a message from admin
      await Message.create({
        orderId: order._id,
        senderId: req.user._id,
        content: messageContent,
      });
      
      // Create a notification for the customer
      await Notification.create({
        userId: order.customerId,
        title: 'Order Approved',
        message: `Your order #${order.orderNumber} has been approved with expected delivery on ${formattedDate}`,
        type: 'order_status',
        orderId: order._id,
      });
    }
    
    res.status(200).json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        expectedDeliveryDate: order.expectedDeliveryDate,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/v1/admin/orders/:id/reject
// @desc    Reject an order
// @access  Private/Admin
router.put('/orders/:id/reject', protect, isAdmin, async (req, res) => {
  try {
    const { notifyCustomer, message } = req.body;
    
    // Find the order
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    // Check if order is in pending status
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order can only be rejected when in pending status',
      });
    }
    
    // Update the status
    order.status = 'rejected';
    await order.save();
    
    // If notification is requested
    if (notifyCustomer) {
      const messageContent = message || 'Your order has been rejected. Please contact us for more information.';
      
      // Create a message from admin
      await Message.create({
        orderId: order._id,
        senderId: req.user._id,
        content: messageContent,
      });
      
      // Create a notification for the customer
      await Notification.create({
        userId: order.customerId,
        title: 'Order Rejected',
        message: `Your order #${order.orderNumber} has been rejected`,
        type: 'order_status',
        orderId: order._id,
      });
      
      // In a real system, you would also send an email to the customer
    }
    
    res.status(200).json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "sorry something went wrong",
    });
  }
});

// @route   POST /api/v1/admin/orders/:id/messages
// @desc    Send a message to customer about an order
// @access  Private/Admin
router.post('/orders/:id/messages', protect, isAdmin, async (req, res) => {
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
    
    // Create message
    const message = await Message.create({
      orderId: order._id,
      senderId: req.user._id,
      content,
    });
    
    // Create notification for customer
    await Notification.create({
      userId: order.customerId,
      title: 'New Message',
      message: `Admin has sent you a message regarding order #${order.orderNumber}`,
      type: 'message',
      orderId: order._id,
    });
    
    // In a real system, you would also send an email to the customer
    
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


// @route   GET /api/v1/admin/orders/:id/documents/:documentType
// @desc    Download document for a specific order
// @access  Private/Admin
router.get('/orders/:id/documents/:documentType', protect, isAdmin, async (req, res) => {
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
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred during document download',
    });
  }
});

// @route   POST /api/v1/admin/orders/:id/documents/:documentType
// @desc    Upload test reports or invoices for an order
// @access  Private/Admin
router.post(
  '/orders/:id/documents/:documentType', 
  protect, 
  isAdmin, 
  upload.single('file'), // Simplified middleware call
  addLocationToFile, // Add the location property
  async (req, res) => {
    try {
      const { id, documentType } = req.params;
      const { notifyCustomer } = req.body;
      
      // Check if document type is valid
      if (!['test-report', 'invoice'].includes(documentType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document type',
        });
      }
      
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a file',
        });
      }
      
      // Find the order
      const order = await Order.findById(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }
      
      // Update the order with the document URL
      if (documentType === 'test-report') {
        order.testReport = req.file.location;
      } else if (documentType === 'invoice') {
        order.invoice = req.file.location;
      }
      
      await order.save();
      
      // If notification is requested
      if (notifyCustomer === 'true' || notifyCustomer === true) {
        // Create a message from admin
        await Message.create({
          orderId: order._id,
          senderId: req.user._id,
          content: `A new ${documentType === 'test-report' ? 'test report' : 'invoice'} has been uploaded for your order.`,
        });
        
        // Create a notification for the customer
        await Notification.create({
          userId: order.customerId,
          title: `New ${documentType === 'test-report' ? 'Test Report' : 'Invoice'} Available`,
          message: `A new ${documentType === 'test-report' ? 'test report' : 'invoice'} is available for your order #${order.orderNumber}`,
          type: 'order_status',
          orderId: order._id,
        });
      }
      
      res.status(201).json({
        success: true,
        document: {
          type: documentType,
          url: req.file.location,
          uploadedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'An error occurred during document upload',
      });
    }
  }
);

// @route   GET /api/v1/admin/customers
// @desc    Get list of all customers
// @access  Private/Admin
router.get('/customers', protect, isAdmin, async (req, res) => {
  try {
    // Find all customers
    const customers = await User.find({ role: 'customer' }).sort({ createdAt: -1 });
    
    // Get order counts for each customer
    const customerData = await Promise.all(
      customers.map(async (customer) => {
        const ordersCount = await Order.countDocuments({ customerId: customer._id });
        
        return {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          company: customer.company,
          phone: customer.phone,
          ordersCount,
          createdAt: customer.createdAt,
        };
      })
    );
    
    res.status(200).json({
      success: true,
      customers: customerData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;