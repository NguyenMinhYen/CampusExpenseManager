import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  PiggyBank,
  Receipt,
  History,
  UserCircle,
  LogOut,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Budget", href: "/budget", icon: PiggyBank },
  { title: "Expenses", href: "/expenses", icon: Receipt },
  { title: "Transactions", href: "/transactions", icon: History },
  { title: "Account", href: "/account", icon: UserCircle },
];

export default function Footer() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background border-t">
      <div className="container max-w-7xl mx-auto">
        <div className="flex items-center justify-between py-2">
          {/* User info */}
          <div className="flex items-center gap-2">
            <div>
              <div className="font-medium">{user?.displayName}</div>
              <div className="text-xs text-muted-foreground">{user?.username}</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={location === item.href ? "secondary" : "ghost"}
                    size="sm"
                    className={cn("gap-2")}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="sr-only md:not-sr-only">{item.title}</span>
                  </Button>
                </Link>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only md:not-sr-only">Logout</span>
            </Button>
          </nav>
        </div>
      </div>
    </footer>
  );
}
