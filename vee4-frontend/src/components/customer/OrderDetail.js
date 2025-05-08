// src/components/customer/OrderDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import PageHeader from '../layout/PageHeader';
import ProgressTracker from '../ui/ProgressTracker';
import FileDownload from '../ui/FileDownload';
import MessageBox from '../layout/MessageBox';

const OrderDetail = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Define progress steps
  const progressSteps = [
    "Order Received",
    "Approved",
    "Material Prep",
    "Fabrication",
    "Powder Coating",
    "Quality Check",
    "Packaging",
    "Delivered"
  ];
  
  // Map status to step number
  const statusToStep = {
    pending: 1,
    approved: 2,
    material_prep: 3,
    fabrication: 4,
    powder_coating: 5,
    quality_check: 6,
    packaging: 7,
    delivered: 8,
    completed: 8
  };
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await orderService.getOrderDetails(orderId);
        setOrder(response.data.order);
        setError(null);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId]);
  
  const handleSendMessage = async (content) => {
    try {
      await orderService.sendOrderMessage(orderId, content);
      
      // Refresh order details to get updated messages
      const response = await orderService.getOrderDetails(orderId);
      setOrder(response.data.order);
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    }
  };
  
  const handleDownloadDocument = async (documentType) => {
    try {
      const response = await orderService.downloadDocument(orderId, documentType);
      
      // Create a blob from the response data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and click it to trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentType}-${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Failed to download document. Please try again.');
    }
  };
  
  if (loading) {
    return <div className="loading">Loading order details...</div>;
  }
  
  if (error || !order) {
    return (
      <div className="error">
        {error || 'Order not found'}
        <Link to="/orders">
          <Button variant="outline" style={{ marginLeft: '1rem' }}>Back to Orders</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <>
      <PageHeader
        title={`Order ${order.orderNumber} Details`}
        subtitle="View your order details and status"
      />
      
      <Card title={`Order ${order.orderNumber}`}>
        <div className="detail-group">
          <p className="detail-label">Date</p>
          <p className="detail-value">{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        
        <div className="detail-group">
          <p className="detail-label">Status</p>
          <p className="detail-value"><StatusBadge status={order.status} /></p>
        </div>

        {/* Adds expected delivery date if it exists */}
        {order.expectedDeliveryDate && (
          <div className="detail-group">
            <p className="detail-label">Expected Delivery</p>
            <p className="detail-value">
              {new Date(order.expectedDeliveryDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        )}
        
        <div className="order-details">
          <div>
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Order Details</h3>
            
            <div className="detail-group">
              <p className="detail-label">Product Type</p>
              <p className="detail-value">{order.productType}</p>
            </div>
            
            <div className="detail-group">
              <p className="detail-label">Metal Type</p>
              <p className="detail-value">{order.metalType}</p>
            </div>
            
            <div className="detail-group">
              <p className="detail-label">Size</p>
              <p className="detail-value">{order.width}mm x {order.height}mm</p>
            </div>
            
            <div className="detail-group">
              <p className="detail-label">Thickness</p>
              <p className="detail-value">{order.thickness}mm</p>
            </div>
            
            <div className="detail-group">
              <p className="detail-label">Color</p>
              <p className="detail-value">{order.color}</p>
            </div>
            
            <div className="detail-group">
              <p className="detail-label">Quantity</p>
              <p className="detail-value">{order.quantity} units</p>
            </div>
            
            {order.additionalRequirements && (
              <div className="detail-group">
                <p className="detail-label">Additional Requirements</p>
                <p className="detail-value">{order.additionalRequirements}</p>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Uploaded Design</h3>
            {order.designFile && (
              <FileDownload
                fileName="design-specification.pdf"
                fileDate={`Uploaded on ${new Date(order.createdAt).toLocaleDateString()}`}
                onDownload={() => handleDownloadDocument('design')}
                buttonText="View PDF"
              />
            )}
          </div>
        </div>
        
        <h3 className="card-title" style={{ margin: '1.5rem 0 1rem' }}>Production Status</h3>
        
        <ProgressTracker 
          steps={progressSteps} 
          currentStep={statusToStep[order.status] || 1}
          expectedDeliveryDate={order.expectedDeliveryDate}
        />

        {order.expectedDeliveryDate && order.status !== 'rejected' && (
          <div className="expected-delivery-highlight">
            <span className="delivery-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </span>
            Expected Delivery: {new Date(order.expectedDeliveryDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
            
            {/* Add countdown if delivery date is in the future */}
            {new Date(order.expectedDeliveryDate) > new Date() && (
              <span className="date-countdown">
                {Math.ceil((new Date(order.expectedDeliveryDate) - new Date()) / (1000 * 60 * 60 * 24))} days left
              </span>
            )}
          </div>
        )}
        
        <div className="document-section">
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>Documents & Reports</h3>
          
          {(!order.testReport && !order.invoice) ? (
            <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '0.375rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem' }}>Test reports and invoice will be available once the order is processed. You can download them from here.</p>
            </div>
          ) : (
            <>
              {order.testReport && (
                <FileDownload
                  fileName="quality-test-report.pdf"
                  fileDate="Quality test report"
                  onDownload={() => handleDownloadDocument('test-report')}
                  buttonText="Download"
                />
              )}
              
              {order.invoice && (
                <FileDownload
                  fileName={`invoice-${order.orderNumber}.pdf`}
                  fileDate="Invoice"
                  onDownload={() => handleDownloadDocument('invoice')}
                  buttonText="Download"
                />
              )}
            </>
          )}
        </div>
        
        <div style={{ marginTop: '1.5rem' }}>
          <MessageBox
            messages={order.messages || []}
            onSendMessage={handleSendMessage}
          />
        </div>
      </Card>
      
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Link to="/orders">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    </>
  );
};

export default OrderDetail;