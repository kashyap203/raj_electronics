import { FaStar, FaUsers, FaStore, FaAward, FaTruck, FaShieldAlt, FaHeadset } from 'react-icons/fa';

const AboutPage = () => {
  const stats = [
    { label: 'Happy Customers', value: '50,000+', icon: FaUsers },
    { label: 'Products Available', value: '2,000+', icon: FaStore },
    { label: 'Years of Service', value: '15+', icon: FaAward },
    { label: 'Cities Covered', value: '100+', icon: FaTruck },
  ];

  const team = [
    { name: 'Rajesh Kumar', role: 'Founder & CEO', img: 'https://i.pravatar.cc/150?img=12' },
    { name: 'Anita Sharma', role: 'Head of Operations', img: 'https://i.pravatar.cc/150?img=47' },
    { name: 'Vikram Singh', role: 'Customer Relations', img: 'https://i.pravatar.cc/150?img=33' },
  ];

  const values = [
    { icon: FaShieldAlt, title: 'Authenticity', desc: 'Every product we sell is 100% genuine with manufacturer warranty.' },
    { icon: FaStar, title: 'Quality First', desc: 'We partner only with top global electronics brands you can trust.' },
    { icon: FaHeadset, title: 'Customer Care', desc: 'Our support team is available 24/7 to help you with any issue.' },
    { icon: FaTruck, title: 'Fast Delivery', desc: 'Most orders are delivered within 2-3 business days across India.' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-dark via-dark-light to-dark text-white py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-primary font-semibold mb-2 animate-fade-in">Est. 2010</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-slide-up">About Raj Electronics</h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg animate-slide-up">
            Your trusted destination for premium electronics since 2010. We bring you the best brands at unbeatable prices, backed by excellent service.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm p-6 text-center hover:-translate-y-1 transition-transform duration-300">
              <Icon className="text-4xl text-primary mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Story</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Raj Electronics was founded in 2010 with a simple mission: to make premium electronics accessible to everyone in India. What started as a small store in Bangalore's electronics market has grown into one of India's most trusted electronics retailers.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                We believe that everyone deserves access to quality electronics at fair prices. That's why we work directly with manufacturers and authorized distributors to bring you the best deals without compromising on quality.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Today, we serve over 50,000 happy customers across 100+ cities in India, offering televisions, refrigerators, washing machines, air conditioners, and much more.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1555421689-491a97ff2040?w=600"
                alt="Our store"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-10">Our Core Values</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl shadow-sm p-6 text-center hover:shadow-lg transition">
              <div className="bg-primary/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <Icon className="text-2xl text-primary" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-10">Meet Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {team.map(member => (
              <div key={member.name} className="text-center group">
                <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-primary/20 group-hover:ring-primary transition">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-gray-800">{member.name}</h3>
                <p className="text-sm text-gray-500">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
