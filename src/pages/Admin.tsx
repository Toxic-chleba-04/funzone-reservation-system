
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Users, Calendar, FileText, Image, Receipt, Layout, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ContentSection } from "@/components/admin/ContentSection";
import { GallerySection } from "@/components/admin/GallerySection";
import { ServicesSection } from "@/components/admin/ServicesSection";
import { LayoutSection } from "@/components/admin/LayoutSection";
import { PricingSection } from "@/components/admin/PricingSection";
import { ReservationsSection } from "@/components/admin/ReservationsSection";
import { UsersSection } from "@/components/admin/UsersSection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSection, setSelectedSection] = useState("obsah");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/login");
          return;
        }
        
        setUser(session.user);
        
        // Kontrola, zda je uživatel admin
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error('Chyba při načítání profilu:', error);
          toast({
            title: "Chyba",
            description: "Nepodařilo se ověřit vaše oprávnění.",
            variant: "destructive"
          });
          return;
        }
        
        if (profile?.role !== 'admin') {
          toast({
            title: "Přístup zamítnut",
            description: "Nemáte oprávnění pro přístup do administrace.",
            variant: "destructive"
          });
          navigate("/");
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        console.error('Chyba ověření uživatele:', error);
        toast({
          title: "Chyba",
          description: "Nepodařilo se ověřit vaši identitu.",
          variant: "destructive"
        });
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          navigate("/login");
        }
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const sections = [
    { id: "obsah", name: "Správa obsahu", icon: FileText },
    { id: "galerie", name: "Galerie", icon: Image },
    { id: "sluzby", name: "Služby", icon: Settings },
    { id: "cenik", name: "Ceník", icon: Receipt },
    { id: "rezervace", name: "Rezervace", icon: Calendar },
    { id: "uzivatele", name: "Uživatelé", icon: Users },
    { id: "layout", name: "Hlavička & Patička", icon: Layout },
  ];

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Odhlášení úspěšné",
        description: "Byli jste úspěšně odhlášeni.",
      });
      navigate("/login");
    } catch (error) {
      console.error('Chyba při odhlášení:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se odhlásit.",
        variant: "destructive"
      });
    }
  };

  const renderContent = () => {
    switch (selectedSection) {
      case "obsah":
        return <ContentSection />;
      case "galerie":
        return <GallerySection />;
      case "sluzby":
        return <ServicesSection />;
      case "layout":
        return <LayoutSection />;
      case "cenik":
        return <PricingSection />;
      case "rezervace":
        return <ReservationsSection />;
      case "uzivatele":
        return <UsersSection />;
      default:
        return (
          <p className="text-muted-foreground">
            Sekce {sections.find((s) => s.id === selectedSection)?.name.toLowerCase()} je připravena k implementaci.
          </p>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Ověřuji přihlášení...</span>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null; // Bude přesměrováno v useEffect
  }

  return (
    <main className="min-h-screen bg-background p-4">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md border-b z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <img 
                src="/lovable-uploads/bfbea331-45d9-48db-81a7-4a5c89636fae.png" 
                alt="UM PARK Logo" 
                className="h-8"
              />
              <h1 className="text-lg font-semibold">Administrace</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">
                {user?.email}
              </span>
              <Button 
                variant="outline" 
                onClick={() => navigate("/")}
              >
                Zpět na web
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Odhlásit
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto pt-20">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Sidebar */}
          <nav className="md:col-span-1 space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    selectedSection === section.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent/10"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{section.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Content Area */}
          <motion.div
            key={selectedSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-5 p-6 bg-card rounded-lg border shadow-sm"
          >
            <h2 className="text-2xl font-semibold mb-6">
              {sections.find((s) => s.id === selectedSection)?.name}
            </h2>
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </main>
  );
};

export default Admin;
