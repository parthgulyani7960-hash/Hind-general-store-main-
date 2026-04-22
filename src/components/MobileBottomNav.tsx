import { Home, ShoppingBag, ShoppingCart, User, Truck } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../StoreContext';
import { cn } from '../types';

export default function MobileBottomNav() {
  const { cart } = useStore();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/products', icon: ShoppingBag, label: 'Shop' },
    { to: '/track-order', icon: Truck, label: 'Track' },
    { to: '/cart', icon: ShoppingCart, label: 'Cart', count: cartCount },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 shadow-lg px-2 py-2 flex justify-between items-center">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center w-full py-1 rounded-lg transition-colors",
            isActive ? "text-primary font-bold" : "text-stone-500 hover:text-primary"
          )}
        >
          <div className="relative">
            <item.icon size={24} />
            {item.count !== undefined && item.count > 0 && (
              <span className="absolute -top-1 -right-2 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {item.count}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
