"use client";

import { MessageCircle, MessageSquarePlus, Quote, Heart } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import type { Testimonial } from "../_lib/student-dashboard-types";

type Props = {
    testimonials: Testimonial[];
    myLikedPostIds: Set<string>;
    onOpenCompose: () => void;
    onToggleLike: (id: string) => void;
};

export function StudentTestimonialsSection({
    testimonials,
    myLikedPostIds,
    onOpenCompose,
    onToggleLike,
}: Props) {
    return (
        <div className="space-y-10 pt-10">
            <div className="flex justify-between items-center px-4">
                <h3 className="text-2xl font-black flex items-center gap-3">
                    <MessageCircle className="w-6 h-6 text-primary" /> قناديل الهدى
                </h3>
                <button
                    type="button"
                    onClick={onOpenCompose}
                    className="px-6 py-3 bg-primary text-white font-black rounded-2xl shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                    <MessageSquarePlus className="w-5 h-5" /> شاركنا تجربتك
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {testimonials.map((t) => (
                    <GlassCard
                        key={t.id}
                        className="p-6 md:p-8 h-full flex flex-col justify-between hover:border-primary/40 transition-all rounded-2xl relative overflow-hidden"
                    >
                        <div className="space-y-4">
                            <Quote className="w-8 h-8 text-primary opacity-20" />
                            <p className="text-sm md:text-base italic font-medium leading-relaxed">{`"${t.content}"`}</p>
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/10">
                                    {t.photoURL ? (
                                        <img src={t.photoURL} alt={t.studentName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-xs font-black">{t.studentName?.[0]}</div>
                                    )}
                                </div>
                                <span className="text-xs font-black truncate max-w-[100px]">{t.studentName}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => onToggleLike(t.id)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-xs",
                                    myLikedPostIds.has(t.id)
                                        ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                                        : "bg-white/5 opacity-60 hover:opacity-100 border border-white/10"
                                )}
                            >
                                <Heart className={cn("w-3.5 h-3.5", myLikedPostIds.has(t.id) && "fill-white")} />
                                <span className="font-bold">{t.likesCount || 0}</span>
                            </button>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
}
