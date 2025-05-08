// src/components/admin/CustomersList.js
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PageHeader from '../layout/PageHeader';

const CustomersList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await adminService.getAllCustomers();
        setCustomers(response.data.customers);
        setError(null);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Failed to load customers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, []);
  
  if (loading) {
    return <div className="loading">Loading customers...</div>;
  }
  
  return (
    <>
      <PageHeader
        title="Customer Management"
        subtitle="View and manage your customers"
      />
      
      <Card title="All Customers">
        {error && <div className="error">{error}</div>}
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.company}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.ordersCount}</td>
                    <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
};

export default CustomersList;