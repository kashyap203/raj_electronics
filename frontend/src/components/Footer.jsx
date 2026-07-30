import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import logo from '../assets/logo.png';

const Footer = () => {
  return (
    <footer className="bg-dark text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <img src={logo} alt="Raj Electronics" className="h-16 md:h-20 lg:h-24 w-auto object-contain" />
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your trusted destination for premium electronics. Quality products, competitive prices, and excellent service since 2010.
          </p>
          <div className="flex gap-4 mt-4">
            {[
              { icon: FaFacebook, href: '#', label: 'Facebook' },
              { icon: FaTwitter, href: '#', label: 'Twitter' },
              { icon: FaInstagram, href: 'https://www.instagram.com/rajelectronicsofficial?igsh=MTN2ZXI5OGZzc2s3Yw==', label: 'Instagram' },
              { icon: FaYoutube, href: '#', label: 'YouTube' },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target={social.href !== '#' ? '_blank' : undefined}
                rel={social.href !== '#' ? 'noopener noreferrer' : undefined}
                aria-label={social.label}
                className="text-gray-400 hover:text-primary transition text-xl"
              >
                <social.icon />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-primary mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            {['Home', 'Products', 'Categories', 'About Us', 'Contact'].map((item) => (
              <li key={item}>
                <Link to={`/${item === 'Home' ? '' : item.toLowerCase().replace(' ', '-')}`} className="hover:text-primary transition">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-primary mb-4">Categories</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            {['Televisions', 'Refrigerators', 'Washing Machines', 'Air Conditioners', 'Flour Grinder'].map((cat) => (
              <li key={cat}>
                <Link to={`/products?category=${encodeURIComponent(cat)}`} className="hover:text-primary transition">
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-primary mb-4">Contact Us</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <FaMapMarkerAlt className="text-primary mt-1 shrink-0" />
              <span>123 Electronics Market, MG Road, Bangalore - 560001</span>
            </li>
            <li className="flex items-center gap-2">
              <FaPhone className="text-primary shrink-0" />
              <span>+91 98765 43210</span>
            </li>
            <li className="flex items-center gap-2">
              <FaEnvelope className="text-primary shrink-0" />
              <span>support@rajelectronics.com</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 gap-2">
          <p>&copy; {new Date().getFullYear()} Raj Electronics. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary">Privacy Policy</a>
            <a href="#" className="hover:text-primary">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
