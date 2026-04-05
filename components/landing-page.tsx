"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { 
  GraduationCap, 
  MapPin, 
  BookOpen, 
  MessageSquare, 
  CheckCircle2, 
  ArrowRight, 
  Activity, 
  Users, 
  BarChart3,
  ShieldCheck,
  UserCheck,
  Settings
} from "lucide-react"
import { Role } from "@/lib/types"

interface LandingPageProps {
  onGetStarted: (role: Role) => void
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const router = useRouter()
  const portals = [
    {
      role: "admin" as Role,
      title: "Admin Portal",
      desc: "For coordinators and institution heads.",
      icon: Settings,
      color: "from-blue-600 to-indigo-600"
    },
    {
      role: "faculty" as Role,
      title: "Faculty Portal",
      desc: "For teaching staff and researchers.",
      icon: UserCheck,
      color: "from-indigo-600 to-purple-600"
    },
    {
      role: "student" as Role,
      title: "Student Corner",
      desc: "For class coordinators and students.",
      icon: Users,
      color: "from-purple-600 to-pink-600"
    }
  ]

  const handleEnterPortal = (role: Role) => {
    router.push(`/login/${role}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#020817] text-white overflow-hidden pb-20">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#020817]/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Faculty Analytics</span>
          </div>
          <button 
            onClick={() => handleEnterPortal("faculty")}
            className="rounded-full bg-white/5 px-6 py-2 text-sm font-medium transition-all hover:bg-white/10"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/20 blur-[120px] rounded-full opacity-30 pointer-events-none" />
        
        <div className="mx-auto max-w-5xl text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold leading-tight mb-8"
          >
            Academic Analytics <br />
            <span className="bg-gradient-to-r from-primary via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Elevated.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mx-auto max-w-2xl text-lg text-white/60 mb-16"
          >
            Choose your portal below to enter the next generation performance system.
          </motion.p>
          
          {/* Portal Cards */}
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
          >
            {portals.map((portal) => (
              <motion.div 
                key={portal.role}
                variants={fadeIn}
                onClick={() => handleEnterPortal(portal.role)}
                className="group relative cursor-pointer overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${portal.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                
                <div className={`mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${portal.color} shadow-xl shadow-indigo-500/20`}>
                  <portal.icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-3">{portal.title}</h3>
                <p className="text-white/50 mb-8 leading-relaxed">{portal.desc}</p>
                
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <span>Enter Portal</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Simplified Features for context */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: ShieldCheck, title: "Secure Access", desc: "Role-specific environments tailored to your daily needs." },
              { icon: Activity, title: "Real-time Sync", desc: "Always up-to-date performance and attendance metrics." },
              { icon: BarChart3, title: "Advanced Reports", desc: "Exportable insights for departmental auditing." }
            ].map((f, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-primary">
                  <f.icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold mb-1 text-lg">{f.title}</h4>
                  <p className="text-sm text-white/40">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer link back to top */}
      <div className="text-center pt-20 border-t border-white/5 mx-6">
        <p className="text-sm text-white/20">© 2026 Faculty Teaching Analytics. All rights reserved.</p>
      </div>
    </div>
  )
}
