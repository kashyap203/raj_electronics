import { useState } from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaWhatsapp } from 'react-icons/fa';
import { Alert } from '../components/common';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setSubmitted(true);
    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    setLoading(false);
  };

  const contactInfo = [
    { icon: FaPhone, label: 'Phone', value: '+91 98243 45041', href: 'tel:+919824345041' },
    { icon: FaWhatsapp, label: 'WhatsApp', value: '+91 98243 45041', href: 'https://wa.me/919824345041' },
    { icon: FaEnvelope, label: 'Email', value: 'support@rajelectronics.com', href: 'mailto:support@rajelectronics.com' },
    { icon: FaClock, label: 'Working Hours', value: 'Mon–Sat: 9AM – 8PM', href: null },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-dark to-dark-light text-white py-16 text-center">
        <h1 className="text-4xl font-bold mb-2">Contact Us</h1>
        <p className="text-gray-300">We'd love to hear from you. Reach out anytime!</p>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="space-y-4">
            {contactInfo.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="bg-white rounded-2xl shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition">
                <div className="bg-primary/10 rounded-xl p-3 shrink-0">
                  <Icon className="text-primary text-xl" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
                  {href ? (
                    <a href={href} className="text-gray-800 font-semibold hover:text-primary transition text-sm">{value}</a>
                  ) : (
                    <p className="text-gray-800 font-semibold text-sm">{value}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Address */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 rounded-xl p-3 shrink-0">
                  <FaMapMarkerAlt className="text-primary text-xl" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Store Address</p>
                  <p className="text-gray-800 font-semibold text-sm">55-19-20, Shreedev Complex</p>
                  <p className="text-gray-600 text-sm">opp. Post Office, Station Road</p>
                  <p className="text-gray-600 text-sm">Patan (N.G.) - 384265, Gujarat, India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Send us a Message</h2>

              {submitted ? (
                <div className="text-center py-10 animate-fade-in">
                  <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <FaEnvelope className="text-green-500 text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Message Sent!</h3>
                  <p className="text-gray-500 mb-4">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                  <button onClick={() => setSubmitted(false)} className="bg-primary text-white font-semibold px-6 py-2 rounded-full hover:bg-primary-dark transition">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Rahul Sharma' },
                      { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
                      { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+91 98765 43210' },
                      { name: 'subject', label: 'Subject', type: 'text', placeholder: 'Product inquiry' },
                    ].map(field => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                        <input
                          type={field.type}
                          name={field.name}
                          value={form[field.name]}
                          onChange={e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))}
                          required={field.name !== 'phone'}
                          placeholder={field.placeholder}
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      required
                      rows={5}
                      placeholder="Tell us how we can help you..."
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                    />
                  </div>

                  <button type="submit" disabled={loading} className="bg-primary hover:bg-primary-dark disabled:opacity-60 text-dark font-bold px-8 py-3 rounded-xl transition">
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Map placeholder */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm overflow-hidden h-64">
          <iframe
            title="Raj Electronics Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.985437706788!2d77.60327057507774!3d12.975519987349426!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e6d%3A0xf8dfc3e8517e4fe0!2sMG%20Road%2C%20Bengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1720000000000!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
