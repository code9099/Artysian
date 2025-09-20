import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-charcoal text-cream py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-gold rounded-lg flex items-center justify-center">
                <span className="text-charcoal font-bold text-lg">C</span>
              </div>
              <span className="text-2xl font-bold font-serif">CraftStory</span>
            </div>
            <p className="text-cream/80 text-sm">
              Preserving cultural heritage through AI-powered storytelling and technology.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/explore" className="text-cream/80 hover:text-gold transition-colors">
                  Explore Crafts
                </Link>
              </li>
              <li>
                <Link href="/role-select" className="text-cream/80 hover:text-gold transition-colors">
                  Join as Artisan
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-cream/80 hover:text-gold transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-cream/80 hover:text-gold transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-gold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-cream/80 hover:text-gold transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-cream/80 hover:text-gold transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-cream/80 hover:text-gold transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-cream/80 hover:text-gold transition-colors">
                  API Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-gold mb-4">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:hello@craftstory.com" className="text-cream/80 hover:text-gold transition-colors">
                  hello@craftstory.com
                </a>
              </li>
              <li>
                <a href="tel:+1234567890" className="text-cream/80 hover:text-gold transition-colors">
                  +1 (234) 567-890
                </a>
              </li>
              <li className="flex space-x-4">
                <a href="#" className="text-cream/80 hover:text-gold transition-colors">
                  Instagram
                </a>
                <a href="#" className="text-cream/80 hover:text-gold transition-colors">
                  Twitter
                </a>
                <a href="#" className="text-cream/80 hover:text-gold transition-colors">
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brown/20 mt-8 pt-8 text-center text-sm text-cream/60">
          <p>&copy; 2024 CraftStory. All rights reserved. Made with ❤️ for cultural preservation.</p>
        </div>
      </div>
    </footer>
  );
}
