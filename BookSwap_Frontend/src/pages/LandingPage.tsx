import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Repeat, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  } as const;

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-muted/50 to-background py-20 lg:py-32 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary"
            >
              <Sparkles className="h-3 w-3" />
              <span>Exchange, Discover, Share</span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl max-w-3xl leading-[1.1]"
            >
              The Modern Way to <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Swap Books</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="max-w-2xl text-lg text-muted-foreground sm:text-xl"
            >
              Discover a thriving community where book lovers connect. List your read books, request trades, and swap stories without the price tag.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 mt-4"
            >
              <Link to={isAuthenticated ? '/dashboard' : '/register'}>
                <Button size="lg" className="w-full sm:w-auto h-12 px-6 text-base group">
                  <span>{isAuthenticated ? 'Go to Dashboard' : 'Join the Community'}</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to={isAuthenticated ? '/dashboard' : '/login'}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-6 text-base">
                  {isAuthenticated ? 'Browse Books' : 'Sign In'}
                </Button>
              </Link>
            </motion.div>

            {/* Subtle Visual Book Art/Mockup */}
            <motion.div
              variants={itemVariants}
              className="relative mt-12 w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
              style={{ contentVisibility: 'auto' }}
            >
              <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 via-muted to-muted/20 flex items-center justify-center p-8">
                <div className="flex gap-4 md:gap-8 items-end max-w-lg">
                  <div className="h-44 w-32 md:h-64 md:w-44 bg-primary text-primary-foreground rounded-lg shadow-lg flex flex-col justify-between p-4 transform -rotate-6 translate-y-8 hover:translate-y-4 transition-all duration-300">
                    <BookOpen className="h-8 w-8 opacity-80" />
                    <div>
                      <p className="font-bold text-sm md:text-base leading-tight">The Great Gatsby</p>
                      <p className="text-xs opacity-75 mt-1">F. Scott Fitzgerald</p>
                    </div>
                  </div>
                  <div className="h-48 w-32 md:h-72 md:w-48 bg-foreground text-background rounded-lg shadow-xl flex flex-col justify-between p-4 z-10 hover:-translate-y-4 transition-all duration-300">
                    <BookOpen className="h-8 w-8 opacity-85" />
                    <div>
                      <p className="font-bold text-base md:text-lg leading-tight">To Kill a Mockingbird</p>
                      <p className="text-xs opacity-80 mt-1">Harper Lee</p>
                    </div>
                  </div>
                  <div className="h-44 w-32 md:h-64 md:w-44 bg-muted border border-border text-foreground rounded-lg shadow-lg flex flex-col justify-between p-4 transform rotate-6 translate-y-8 hover:translate-y-4 transition-all duration-300">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-bold text-sm md:text-base leading-tight text-foreground">1984</p>
                      <p className="text-xs text-muted-foreground mt-1">George Orwell</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-20 lg:py-28 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How BookSwap Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              BookSwap makes it incredibly simple to circulate your books and discover new reads from fellow readers.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="flex flex-col p-8 rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">List Your Books</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Add books you've already read to your public shelf. Give detail on their condition so potential swappers know what to expect.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="flex flex-col p-8 rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Repeat className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Request Exchanges</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Browse books listed by other users in your area. Initiate a swap request for books you'd love to read next.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="flex flex-col p-8 rounded-2xl border border-border bg-card shadow-sm sm:col-span-2 lg:col-span-1 mx-auto w-full"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Grow the Community</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Connect with local book lovers. Discuss literature, establish trust, and participate in a completely cashless economy.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust / Community Callout */}
      <section className="w-full bg-muted/30 py-16 border-t border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-card border border-border rounded-2xl p-8 lg:p-12 shadow-sm">
            <div className="flex flex-col gap-3 max-w-xl text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 text-primary font-semibold">
                <ShieldCheck className="h-5 w-5" />
                <span>Secure & Validated Exchanges</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground sm:text-3xl">Safe book swaps you can trust</h3>
              <p className="text-muted-foreground">
                All requests, approvals, and book conditions are securely validated. Your exchange logs and status records are updated in real-time.
              </p>
            </div>
            <Link to={isAuthenticated ? '/dashboard' : '/register'} className="w-full lg:w-auto">
              <Button size="lg" className="w-full lg:w-auto">Get Started Now</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
