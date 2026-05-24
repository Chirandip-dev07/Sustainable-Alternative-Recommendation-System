import { Navbar } from "@/components/navbar";
import { Leaf, ScanLine, ShieldCheck, Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      <div className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-emerald-900 text-emerald-50">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Leaf className="h-16 w-16 mx-auto text-emerald-400 mb-4 animate-bounce" />
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
              Our Mission for a Greener Tomorrow
            </h1>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
              EcoNova GreenLens was built with a simple goal: to make sustainable choices easy, transparent, and accessible to everyone.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight">Why We Built GreenLens</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Every day, we make dozens of small purchasing decisions. Unfortunately, it's often difficult to know the true environmental impact of the products we buy. Greenwashing and confusing labels make it hard to choose the genuinely sustainable option.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                We believe technology can bridge this gap. By leveraging advanced AI vision models, GreenLens can instantly analyze materials, estimate carbon footprints, and score a product's reusability. 
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-card border rounded-2xl p-6 shadow-sm hover:border-emerald-500/50 transition-colors">
                <ScanLine className="h-8 w-8 text-blue-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">Instant Scanning</h3>
                <p className="text-sm text-muted-foreground">Point your camera at any product to reveal its hidden eco-data instantly.</p>
              </div>
              <div className="bg-card border rounded-2xl p-6 shadow-sm hover:border-emerald-500/50 transition-colors">
                <ShieldCheck className="h-8 w-8 text-emerald-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">Honest Scoring</h3>
                <p className="text-sm text-muted-foreground">Our algorithm cuts through greenwashing to give you a true sustainability score.</p>
              </div>
              <div className="bg-card border rounded-2xl p-6 shadow-sm sm:col-span-2 hover:border-emerald-500/50 transition-colors text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="bg-rose-100 dark:bg-rose-900/30 p-4 rounded-full">
                  <Heart className="h-10 w-10 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Community Driven</h3>
                  <p className="text-sm text-muted-foreground">Together, we can shift the market by choosing better, greener alternatives and reducing global plastic waste through mindful consumption.</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Hackathon Team Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#2d5f47] text-white">
          <div className="max-w-6xl mx-auto space-y-12 text-center">
            <div className="space-y-4">
              <span className="inline-block px-4 py-1 text-xs font-bold tracking-widest text-emerald-100 uppercase bg-white/10 rounded-full mb-4">
                TEAM ECONOVA
              </span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">The Minds Behind GreenLens</h2>
              <p className="text-emerald-100 text-sm md:text-base font-medium max-w-2xl mx-auto">
                Techno India University · OmTech 2026 · Open Innovation
              </p>
            </div>
            
            {/* Team Members */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 pt-8">
              {[
                { initials: 'CR', name: 'Chirandip Roy' },
                { initials: 'SS', name: 'Soumodeep Saha' },
                { initials: 'SS', name: 'Sagnik Sarkar' },
                { initials: 'RC', name: 'Rudrava Chowdhury' },
                { initials: 'RG', name: 'Ritankar Ghosh' },
              ].map((member) => (
                <div key={member.initials} className="flex flex-col items-center space-y-4">
                  <div className="h-20 w-20 rounded-full border border-white/30 bg-transparent flex items-center justify-center font-serif text-xl font-bold text-white shadow-sm">
                    {member.initials}
                  </div>
                  <p className="text-sm font-medium text-emerald-100">{member.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50 text-center border-t border-b">
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">Ready to start scanning?</h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of others making better choices for the environment today.
            </p>
            <Link href="/scanner">
              <Button size="lg" className="rounded-full px-8 h-14 text-lg bg-emerald-600 hover:bg-emerald-700 text-white">
                Launch the Scanner
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-[#1a2e22] text-center text-emerald-100/70 text-xs">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-50 mb-2">
              <Leaf className="h-4 w-4 text-emerald-400" />
              EcoNova GreenLens
            </div>
            <p>Powered by Gemini AI · Flask · MongoDB · Built with 💚 for a greener planet</p>
            <p>© 2026 Team EcoNova · Techno India University · OmTech 2026</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
