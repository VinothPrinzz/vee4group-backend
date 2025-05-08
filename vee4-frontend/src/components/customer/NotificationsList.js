// src/components/customer/NotificationsList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PageHeader from '../layout/PageHeader';

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const { id, title, message, isRead, type, orderId, createdAt } = notification;
  
  // Format date
  const formattedDate = new Date(createdAt).toLocaleString();
  
  return (
    <div className={`notification-item ${isRead ? 'read' : 'unread'}`}>
      <div className="notification-content">
        <h4 className="notification-title">{title}</h4>
        <p className="notification-message">{message}</p>
        <div className="notification-meta">
          <span className="notification-time">{formattedDate}</span>
          {!isRead && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onMarkAsRead(id)}
            >
              Mark as Read
            </Button>
          )}
        </div>
      </div>
      
      {orderId && (
        <div className="notification-actions">
          <Link to={`/orders/${orderId}`}>
            <Button variant="outline" size="sm">View Order</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

const NotificationsList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await notificationService.getNotifications();
        setNotifications(response.data.notifications);
        setError(null);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, []);
  
  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update the notifications list
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      alert('Failed to mark notification as read. Please try again.');
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update all notifications as read
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      alert('Failed to mark all notifications as read. Please try again.');
    }
  };
  
  const unreadCount = notifications.filter(notification => !notification.isRead).length;
  
  if (loading) {
    return <div className="loading">Loading notifications...</div>;
  }
  
  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with your order status and messages"
      />
      
      <Card 
        title={`Notifications (${unreadCount} unread)`}
        action={
          unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              Mark All as Read
            </Button>
          )
        }
      >
        {error && <div className="error">{error}</div>}
        
        <div className="notifications-list">
          {notifications.length === 0 ? (
            <p>No notifications yet.</p>
          ) : (
            notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))
          )}
        </div>
      </Card>
    </>
  );
};

export default NotificationsList;