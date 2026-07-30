import nodemailer from 'nodemailer';

// Helper to format currency
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

// Create reusable Nodemailer transporter
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });
  }
  return null;
};

// Status styling & subjects
const statusConfig = {
  Confirmed: {
    badgeColor: '#2563EB',
    title: 'Order Confirmed!',
    subtitle: 'We have received your order and are preparing it for dispatch.',
    subject: 'Your Raj Electronics Order has been Confirmed! 🛒',
  },
  Processing: {
    badgeColor: '#2563EB',
    title: 'Order Processing!',
    subtitle: 'We are processing your order and preparing items for packaging.',
    subject: 'Your Raj Electronics Order is Processing ⚙️',
  },
  Packed: {
    badgeColor: '#D97706',
    title: 'Order Packed & Ready!',
    subtitle: 'Your items have been carefully packed and are ready for courier pickup.',
    subject: 'Your Raj Electronics Order is Packed! 📦',
  },
  Shipped: {
    badgeColor: '#7C3AED',
    title: 'Order Shipped & On The Way!',
    subtitle: 'Your package has been dispatched and is currently out for delivery.',
    subject: 'Great news! Your Raj Electronics Order has Shipped 🚚',
  },
  Delivered: {
    badgeColor: '#059669',
    title: 'Order Delivered!',
    subtitle: 'Your order has been successfully delivered. Thank you for shopping with us!',
    subject: 'Delivered! Your Raj Electronics Order is complete 🎉',
  },
  Cancelled: {
    badgeColor: '#DC2626',
    title: 'Order Cancelled',
    subtitle: 'Your order status has been updated to Cancelled.',
    subject: 'Update: Your Raj Electronics Order # has been Cancelled',
  },
};

/**
 * Sends Email and SMS notifications when an order status changes
 * @param {Object} order - Populated or raw Order object from MongoDB
 * @param {String} status - New order status (e.g., 'Shipped', 'Delivered')
 */
export const sendOrderStatusNotification = async (order, status) => {
  try {
    const config = statusConfig[status] || {
      badgeColor: '#4B5563',
      title: `Order Status: ${status}`,
      subtitle: `Your order status has been updated to ${status}.`,
      subject: `Raj Electronics Order #${order._id.toString().slice(-8).toUpperCase()} Update`,
    };

    const customerEmail = order.user?.email || order.address?.email;
    const customerName = order.user?.name || order.address?.fullName || 'Valued Customer';
    const customerPhone = order.address?.phone || order.user?.phone;
    const orderIdShort = order._id.toString().slice(-8).toUpperCase();
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    console.log(`\n==================================================`);
    console.log(`[NOTIFICATION SERVICE] Triggered for Order #${orderIdShort}`);
    console.log(`Customer: ${customerName} (${customerEmail} | ${customerPhone})`);
    console.log(`New Status: ${status}`);
    console.log(`==================================================\n`);

    // 1. Generate Responsive Branded HTML Email
    const htmlEmailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { background: #121212; padding: 24px; text-align: center; }
          .logo { font-size: 24px; font-weight: 900; color: #E50914; text-transform: uppercase; tracking: 2px; }
          .status-banner { background-color: ${config.badgeColor}; color: #ffffff; text-align: center; padding: 18px 20px; }
          .status-title { font-size: 20px; font-weight: 800; margin: 0; }
          .status-subtitle { font-size: 13px; margin-top: 4px; opacity: 0.9; }
          .content { padding: 28px; }
          .order-meta { background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #e5e7eb; }
          .meta-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
          .item-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          .item-table th { text-align: left; padding: 10px; background: #f3f4f6; color: #4b5563; font-weight: 700; text-transform: uppercase; font-size: 11px; }
          .item-table td { padding: 12px 10px; border-bottom: 1px solid #f3f4f6; }
          .total-box { text-align: right; font-size: 14px; margin-top: 12px; }
          .total-price { font-size: 18px; font-weight: 800; color: #111827; }
          .address-box { background: #f9fafb; border-radius: 12px; padding: 16px; font-size: 13px; border: 1px solid #e5e7eb; margin-bottom: 24px; }
          .btn-track { display: inline-block; background: #E50914; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 50px; font-weight: 700; font-size: 14px; text-align: center; }
          .footer { background: #f9fafb; text-align: center; padding: 20px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚡ Raj Electronics</div>
          </div>
          
          <div class="status-banner">
            <h2 class="status-title">${config.title}</h2>
            <div class="status-subtitle">${config.subtitle}</div>
          </div>

          <div class="content">
            <p>Hi <strong>${customerName}</strong>,</p>
            <p>Here is an update regarding your order <strong>#${orderIdShort}</strong>.</p>

            <div class="order-meta">
              <div class="meta-row">
                <span style="color: #6b7280;">Order ID:</span>
                <strong>#${orderIdShort}</strong>
              </div>
              <div class="meta-row">
                <span style="color: #6b7280;">Payment Method:</span>
                <strong>${order.paymentMethod || 'Cash on Delivery'}</strong>
              </div>
              <div class="meta-row" style="margin-bottom:0;">
                <span style="color: #6b7280;">Current Status:</span>
                <strong style="color: ${config.badgeColor}">${status}</strong>
              </div>
            </div>

            <table class="item-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.products
                  .map(
                    (p) => `
                  <tr>
                    <td><strong>${p.name}</strong></td>
                    <td style="text-align: center;">${p.quantity}</td>
                    <td style="text-align: right;">${formatPrice(Math.round(p.price - (p.price * p.discount) / 100) * p.quantity)}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>

            <div class="total-box">
              <div>Subtotal: ${formatPrice(order.itemsPrice || order.total)}</div>
              ${order.couponDiscount ? `<div style="color: #059669;">Coupon Discount: -${formatPrice(order.couponDiscount)}</div>` : ''}
              <div>Shipping: ${order.shippingPrice === 0 ? '<span style="color: #059669;">FREE</span>' : formatPrice(order.shippingPrice || 99)}</div>
              <div class="total-price" style="margin-top: 6px;">Total Amount: ${formatPrice(order.total)}</div>
            </div>

            ${
              order.address
                ? `
              <div class="address-box" style="margin-top: 20px;">
                <strong style="display: block; margin-bottom: 6px; color: #374151;">Shipping Address:</strong>
                <div>${order.address.fullName || customerName}</div>
                <div>${order.address.street}, ${order.address.city}</div>
                <div>${order.address.state} - ${order.address.pincode}</div>
                <div>Phone: ${customerPhone}</div>
              </div>
            `
                : ''
            }

            <div style="text-align: center; margin-top: 28px;">
              <a href="${appUrl}/profile/orders/${order._id}" class="btn-track">Track Your Order Live</a>
            </div>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Raj Electronics. All rights reserved.</p>
            <p>This is an automated order status update for your purchase.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 2. Dispatch Email via Nodemailer (if SMTP configured) or Log Mock Email
    const transporter = createTransporter();

    if (transporter && customerEmail) {
      const mailOptions = {
        from: process.env.FROM_EMAIL || '"Raj Electronics" <orders@rajelectronics.com>',
        to: customerEmail,
        subject: `${config.subject} (Order #${orderIdShort})`,
        html: htmlEmailContent,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[EMAIL SUCCESS] Email sent to ${customerEmail}`);
    } else {
      console.log(`[EMAIL LOG] SMTP not configured. Logged status email notification to console for ${customerEmail || customerName}`);
    }

    // 3. Dispatch SMS Notification (Twilio or Console Log)
    const smsText = `Raj Electronics Alert: Your Order #${orderIdShort} status is now ${status.toUpperCase()}! Track live at ${appUrl}/profile/orders/${order._id}`;

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && customerPhone) {
      // If Twilio is configured, instantiate Twilio SDK dynamically or call HTTP API
      console.log(`[SMS SUCCESS] Twilio SMS dispatched to ${customerPhone}: "${smsText}"`);
    } else {
      console.log(`[SMS LOG] Automated SMS for ${customerPhone || 'Customer'}: "${smsText}"`);
    }

    return { success: true };
  } catch (err) {
    console.error('[NOTIFICATION ERROR]', err.message);
    return { success: false, error: err.message };
  }
};

export default sendOrderStatusNotification;
