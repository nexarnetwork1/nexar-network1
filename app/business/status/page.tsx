import { Metadata } from "next";
import { CheckCircle2, AlertCircle, Clock, Activity, Server, Database, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "System Status - Nexar Network",
  description: "Real-time system status and operational metrics for Nexar Network payment platform.",
};

export default function StatusPage() {
  return (
    <Container>
      <div className="max-w-4xl mx-auto py-20">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            System Status
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time operational status for Nexar Network payment platform.
          </p>
        </div>

        {/* Status Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              name: "Payment Processing",
              status: "operational",
              icon: Activity,
              uptime: "99.99%",
            },
            {
              name: "API Services",
              status: "operational",
              icon: Server,
              uptime: "99.98%",
            },
            {
              name: "Database",
              status: "operational",
              icon: Database,
              uptime: "99.99%",
            },
            {
              name: "Blockchain Network",
              status: "operational",
              icon: Globe,
              uptime: "99.95%",
            },
          ].map((service, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/50 bg-background/50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <service.icon className="h-5 w-5 text-green-400" />
                </div>
                <div className="flex h-3 w-3 items-center justify-center rounded-full bg-green-500">
                  <CheckCircle2 className="h-2 w-2 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{service.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">Operational</p>
              <div className="text-xs text-green-400 font-medium">{service.uptime} uptime</div>
            </div>
          ))}
        </div>

        {/* Incidents */}
        <div className="rounded-xl border border-border/50 bg-background/50 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Incidents</h3>
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">No incidents in the last 90 days</p>
            <p className="text-sm text-muted-foreground">All systems are running smoothly</p>
          </div>
        </div>

        {/* Uptime History */}
        <div className="rounded-xl border border-border/50 bg-background/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">90-Day Uptime</h3>
          <div className="flex gap-1 mb-4">
            {Array.from({ length: 90 }).map((_, index) => (
              <div
                key={index}
                className="h-2 flex-1 rounded-full bg-green-500"
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall uptime</span>
            <span className="text-green-400 font-medium">99.97%</span>
          </div>
        </div>
      </div>
    </Container>
  );
}
