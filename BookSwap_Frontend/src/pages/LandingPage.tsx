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
              <Link to="/books">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-6 text-base">
                  Browse Books
                </Button>
              </Link>
            </motion.div>

            {/* Book Covers Visual Showcase */}
            <motion.div
              variants={itemVariants}
              className="relative mt-12 w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
              style={{ contentVisibility: 'auto' }}
            >
              <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 via-muted to-muted/20 flex items-center justify-center p-6 sm:p-8">
                <div className="flex gap-4 md:gap-8 items-end max-w-lg">
                  {/* Left Book: The Jungle Book */}
                  <div className="group relative h-52 w-28 sm:h-64 sm:w-36 md:h-72 md:w-40 rounded-2xl overflow-hidden shadow-2xl border border-border/40 transform -rotate-6 translate-y-8 hover:translate-y-4 transition-all duration-300 cursor-pointer">
                    {/* Spine shadow overlay */}
                    <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/40 via-black/10 to-transparent z-10 pointer-events-none" />
                    <img
                      src="/images/jungle-book.jpg"
                      alt="The Jungle Book by Rudyard Kipling"
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      loading="eager"
                    />
                  </div>

                  {/* Center Book: Harry Potter */}
                  <div className="group relative h-60 w-32 sm:h-72 sm:w-40 md:h-80 md:w-44 rounded-2xl overflow-hidden shadow-2xl border border-border/40 z-10 hover:-translate-y-4 transition-all duration-300 cursor-pointer">
                    {/* Spine shadow overlay */}
                    <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-black/10 to-transparent z-10 pointer-events-none" />
                    <img
                      src="/images/harry-potter.jpg"
                      alt="Harry Potter and the Philosopher's Stone"
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      loading="eager"
                    />
                  </div>

                  {/* Right Book: A Dark and Secret Magic */}
                  <div className="group relative h-52 w-28 sm:h-64 sm:w-36 md:h-72 md:w-40 rounded-2xl overflow-hidden shadow-2xl border border-border/40 transform rotate-6 translate-y-8 hover:translate-y-4 transition-all duration-300 cursor-pointer">
                    {/* Spine shadow overlay */}
                    <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/40 via-black/10 to-transparent z-10 pointer-events-none" />
                    <img
                      src="/images/dark-and-secret-magic.jpg"
                      alt="A Dark and Secret Magic by Wallis Kinney"
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      loading="eager"
                    />
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
