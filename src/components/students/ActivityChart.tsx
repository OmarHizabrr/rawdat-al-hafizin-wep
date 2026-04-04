"use client";

import { motion } from "framer-motion";

interface ActivityChartProps {
    logs: any[];
}

export function ActivityChart({ logs }: ActivityChartProps) {
    // Generate 7 days of data
    const data = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayStr = date.toISOString().split('T')[0];
        const log = logs.find(l => l.date === dayStr);
        return log?.completed ? 100 : (log?.completedTasks?.length || 0) > 0 ? 50 : 10;
    });

    return (
        <div className="flex items-end gap-1 h-12 bg-white/5 p-2 rounded-xl border border-white/10">
            {data.map((val, i) => (
                <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${val}%` }}
                    className={`w-2 rounded-full transition-colors ${
                        val === 100 ? 'bg-primary' : val === 50 ? 'bg-amber-500' : 'bg-muted opacity-20'
                    }`}
                />
            ))}
        </div>
    );
}
