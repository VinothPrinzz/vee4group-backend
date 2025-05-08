// src/components/admin/OrdersList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import StatusBadge from '../ui/StatusBadge';
import PageHeader from '../layout/PageHeader';

const OrdersFilter = ({ onFilter }) => {
  const [filters, setFilters] = useState({
    status: '',
    customer: '',
    startDate: '',
    endDate: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };
  
  const handleReset = () => {
    setFilters({
      status: '',
      customer: '',
      startDate: '',
      endDate: ''
    });
    onFilter({});
  };
  
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'material_prep', label: 'Material Prep' },
    { value: 'fabrication', label: 'Fabrication' },
    { value: 'powder_coating', label: 'Powder Coating' },
    { value: 'quality_check', label: 'Quality Check' },
    { value: 'packaging', label: 'Packaging' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'completed', label: 'Completed' }
  ];
  
  return (
    <div>
      <h3 className="card-title" style={{ marginBottom: '1rem' }}>Filter Orders</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="filter-row">
          <div className="filter-item">
            <FormField
              id="status"
              name="status"
              label="Status"
              type="select"
              value={filters.status}
              onChange={handleChange}
              options={statusOptions}
            />
          </div>
          
          <div className="filter-item">
            <FormField
              id="customer"
              name="customer"
              label="Customer Name"
              type="text"
              placeholder="Search by customer"
              value={filters.customer}
              onChange={handleChange}
            />
          </div>
          
          <div className="filter-item">
            <FormField
              id="startDate"
              name="startDate"
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={handleChange}
            />
          </div>
          
          <div className="filter-item">
            <FormField
              id="endDate"
              name="endDate"
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={handleChange}
            />
          </div>
          
          <div className="filter-actions">
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button type="submit" variant="primary">
              Apply Filters
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await adminService.getAllOrders(filters);
        setOrders(response.data.orders);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [filters]);
  
  const handleFilter = (newFilters) => {
    setFilters(newFilters);
  };
  
  if (loading && orders.length === 0) {
    return <div className="loading">Loading orders...</div>;
  }
  
  return (
    <>
      <PageHeader
        title="Dashboard Overview"
        subtitle="Monitor and manage all customer orders"
      />
      
      <Card>
        <OrdersFilter onFilter={handleFilter} />
      </Card>
      
      <Card title="All Orders">
        {error && <div className="error">{error}</div>}
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>
                    No orders found with the current filters.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.orderNumber}</td>
                    <td>{order.customer.name} ({order.customer.company})</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td>
                      <Link to={`/admin/orders/${order.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </td>
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

export default OrdersList;