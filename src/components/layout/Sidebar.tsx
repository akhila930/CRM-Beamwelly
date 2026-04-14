import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Share2, 
  DollarSign, 
  FileText, 
  MessageSquare,
  Calendar, 
  UserCheck, 
  CheckSquare, 
  CreditCard,
  BarChartHorizontal,
  ChevronLeft,
  Menu,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSequentialFadeIn } from '@/lib/animations';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  description?: string;
};

const mainNav: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview of all KPIs',
  },
  {
    title: 'Employee Dashboard',
    href: '/employee',
    icon: Users,
    description: 'Employee performance and metrics',
  },
  {
    title: 'Recruitment',
    href: '/recruitment',
    icon: UserCheck,
    description: 'Manage candidate pipeline',
  },
  {
    title: 'Social Media',
    href: '/social',
    icon: Share2,
    description: 'Campaign management',
  },
  {
    title: 'Budget',
    href: '/budget',
    icon: DollarSign,
    description: 'Financial tracking',
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: FileText,
    description: 'Document repository',
  },
  {
    title: 'Feedback',
    href: '/feedback',
    icon: MessageSquare,
    description: 'Employee and investor feedback',
  },
  {
    title: 'Leave Management',
    href: '/leave',
    icon: Calendar,
    description: 'Track leave requests',
  },
  {
    title: 'Lead & Client',
    href: '/leads',
    icon: UserCheck,
    description: 'Customer relationship management',
  },
  {
    title: 'Tasks & Productivity',
    href: '/tasks',
    icon: CheckSquare,
    description: 'Track productivity and tasks',
  },
  {
    title: 'Salary',
    href: '/salary',
    icon: CreditCard,
    description: 'Payroll management',
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChartHorizontal,
    description: 'Reports and insights',
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const itemAnimationStyles = useSequentialFadeIn(mainNav.length, 100, 30);
  const { logout, user } = useAuth();

  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 1024) {
        setExpanded(false);
        setIsMobile(true);
      } else {
        setExpanded(true);
        setIsMobile(false);
      }
    };

    // Initial check
    checkScreenSize();

    // Event listener for window resize
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => setExpanded(!expanded);

  return (
    <>
      {isMobile && expanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {isMobile && !expanded && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 left-4 z-50 shadow-lg rounded-full bg-white dark:bg-gray-800"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
    
      <div
        className={cn(
          "flex flex-col h-screen border-r shadow-sm bg-background/95 backdrop-blur-sm",
          expanded ? "w-64" : "w-[70px]",
          isMobile && expanded ? "fixed inset-y-0 left-0 z-50" : "",
          isMobile && !expanded ? "hidden" : "",
          "transition-all duration-300 ease-in-out",
          className
        )}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <div className="flex items-center">
            {/* Display company logo if available, otherwise company name or default */}
            {user?.logo_url ? (
              <img
                src={`http://localhost:8000${user.logo_url}`}
                alt="Company Logo"
                className={cn(
                  "transition-all duration-300 max-h-10",
                  expanded ? "w-36" : "w-8"
                )}
              />
            ) : user?.company_name ? (
              <span className={cn(
                "font-semibold text-lg transition-all duration-300 overflow-hidden",
                expanded ? "opacity-100 w-auto" : "opacity-0 w-0"
              )}>
                {expanded ? user.company_name : ""}
              </span>
             ) : (
              <span className={cn(
                "font-semibold text-lg transition-all duration-300 overflow-hidden",
                expanded ? "opacity-100 w-auto" : "opacity-0 w-0"
              )}>
                {expanded ? "Your Company" : ""}
              </span>
            )}
          </div>
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8"
            >
              <ChevronLeft 
                className={cn(
                  "h-4 w-4 transition-transform duration-300",
                  !expanded && "rotate-180"
                )} 
              />
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-auto py-2">
          <nav className="grid gap-1 px-2">
            {mainNav.map((item, i) => {
              const isActive = location.pathname === item.href || 
                              (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              return (
                <TooltipProvider key={item.href} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link 
                        to={item.href}
                        style={itemAnimationStyles[i]}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
                          "hover:bg-accent hover:text-accent-foreground",
                          isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground",
                          !expanded && "justify-center px-2"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5", isActive && "text-brand-red")} />
                        {expanded && <span>{item.title}</span>}
                      </Link>
                    </TooltipTrigger>
                    {!expanded && (
                      <TooltipContent side="right">
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "w-full justify-start gap-2 text-muted-foreground",
                    !expanded && "justify-center px-0"
                  )}
                  onClick={logout}
                >
                  <LogOut className="h-5 w-5" />
                  {expanded && <span>Logout</span>}
                </Button>
              </TooltipTrigger>
              {!expanded && (
                <TooltipContent side="right">
                  Logout
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </>
  );
}
