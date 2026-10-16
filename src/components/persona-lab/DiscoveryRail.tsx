import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Check, Gauge, MessageSquareShare, Sparkles, Swords, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeUp, scaleIn, springPop, staggerContainer } from "@/lib/motion";
import { getDisplayTags, getInitials, type CompatibilityRow, type ProfileRow } from "@/lib/persona-lab";

interface DiscoveryRailProps {
  compatibilityPreview: CompatibilityRow | null;
  isLaunching: boolean;
  isPreviewing: boolean;
  onPreviewMatch: (targetUserId: string) => Promise<void>;
  onSelect: (userIds: string[]) => void;
  onStartConversation: (mode: "chat" | "debate", topic: string) => Promise<void>;
  onStartBotMeeting: (targetUserId: string, topic: string) => Promise<void>;
  profiles: ProfileRow[];
  selectedUserIds: string[];
}

export const DiscoveryRail = ({
  compatibilityPreview,
  isLaunching,
  isPreviewing,
  onPreviewMatch,
  onSelect,
  onStartConversation,
  onStartBotMeeting,
  profiles,
  selectedUserIds,
}: DiscoveryRailProps) => {
  const [topic, setTopic] = useState("");

  const selectedProfiles = useMemo(
    () => profiles.filter((profile) => selectedUserIds.includes(profile.user_id)),
    [profiles, selectedUserIds],
  );

  const toggleSelect = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onSelect(selectedUserIds.filter((id) => id !== userId));
    } else {
      onSelect([...selectedUserIds, userId]);
    }
  };

  const firstSelected = selectedProfiles[0] ?? null;

  return (
    <motion.section
      className="surface-panel flex h-full flex-col gap-5 p-6"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <motion.div className="space-y-2" variants={fadeUp} custom={0}>
        <p className="section-kicker">Directory & matching</p>
        <h2 className="display-title text-3xl">Discover other AI personas.</h2>
        <p className="text-sm text-muted-foreground">
          Pick one or more public personas, inspect compatibility, then launch a live autonomous conversation.
        </p>
      </motion.div>

      <motion.div className="grid gap-3" variants={staggerContainer}>
        {profiles.length ? (
          profiles.map((profile, i) => {
            const isActive = selectedUserIds.includes(profile.user_id);
            const tags = getDisplayTags(profile);

            return (
              <motion.button
                className={`directory-card ${isActive ? "directory-card-active" : ""}`}
                key={profile.user_id}
                onClick={() => toggleSelect(profile.user_id)}
                type="button"
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                layout
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <span className="avatar-orb">{getInitials(profile.name)}</span>
                    <AnimatePresence>
                      {isActive && (
                        <motion.span
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          <Check className="h-3 w-3" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="space-y-1 text-left">
                    <p className="text-base font-semibold text-foreground">{profile.name ?? "Anonymous mind"}</p>
                    <p className="text-sm text-muted-foreground">{profile.field_of_study ?? "Multi-disciplinary"}</p>
                  </div>
                </div>

                <p className="line-clamp-3 text-sm leading-6 text-foreground/85">
                  {profile.persona_summary ?? "Persona summary not generated yet."}
                </p>

                <div className="flex flex-wrap gap-2">
                  {tags.length ? tags.map((tag) => <span className="tag-chip" key={tag}>{tag}</span>) : <span className="tag-chip">Open to new ideas</span>}
                </div>
              </motion.button>
            );
          })
        ) : (
          <motion.div className="empty-tile" variants={scaleIn}>
            <UsersRound className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">No public personas yet — once others sign up, they will appear here.</p>
          </motion.div>
        )}
      </motion.div>

      <motion.div className="mt-auto rounded-[1.75rem] border border-border/70 bg-background/65 p-5" variants={fadeUp} custom={3}>
        <div className="space-y-2">
          <p className="section-kicker">Launchpad</p>
          <h3 className="text-lg font-semibold text-foreground">
            {selectedProfiles.length > 1
              ? `Group with ${selectedProfiles.length} personas`
              : firstSelected
                ? `Talk with ${firstSelected.name ?? "this persona"}`
                : "Select a persona"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {selectedProfiles.length > 1
              ? "All selected personas will take turns in the conversation."
              : "Add an optional topic, then start an AI chat or a sharper structured debate."}
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <AnimatePresence>
            {selectedProfiles.length > 0 && (
              <motion.div
                className="flex flex-wrap gap-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {selectedProfiles.map((p) => (
                  <motion.span className="tag-chip" key={p.user_id} variants={springPop} initial="hidden" animate="visible">
                    {p.name ?? "Persona"}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <Input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Optional topic: robotics startups, AI and jobs, design systems..."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <motion.div whileTap={{ scale: 0.96 }}>
              <Button
                className="w-full"
                variant="panel"
                onClick={() => firstSelected && onPreviewMatch(firstSelected.user_id)}
                disabled={!firstSelected || isPreviewing}
              >
                <Gauge className="h-4 w-4" />
                {isPreviewing ? "Scanning..." : "Preview match"}
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.96 }}>
              <Button
                className="w-full"
                variant="hero"
                onClick={() => selectedProfiles.length > 0 && onStartConversation("chat", topic)}
                disabled={selectedProfiles.length === 0 || isLaunching}
              >
                <MessageSquareShare className="h-4 w-4" />
                AI chat
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.96 }}>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => selectedProfiles.length > 0 && onStartConversation("debate", topic)}
                disabled={selectedProfiles.length === 0 || isLaunching}
              >
                <Swords className="h-4 w-4" />
                Debate
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.96 }}>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => firstSelected && onStartBotMeeting(firstSelected.user_id, topic)}
                disabled={!firstSelected || isLaunching}
                title="Your personal AI bot meets theirs and they swap notes about you both"
              >
                <Bot className="h-4 w-4" />
                Bots meet
              </Button>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {compatibilityPreview && (
            <motion.div
              className="mt-4 rounded-[1.5rem] border border-border/70 bg-secondary/70 p-4"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-kicker">Compatibility</p>
                  <motion.p
                    className="display-title text-3xl"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                  >
                    {Math.round(compatibilityPreview.score)}%
                  </motion.p>
                </div>
                <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 0.6, delay: 0.3 }}>
                  <Sparkles className="h-5 w-5 text-primary" />
                </motion.div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...compatibilityPreview.common_interests, ...compatibilityPreview.common_skills]
                  .slice(0, 5)
                  .map((item, i) => (
                    <motion.span
                      className="tag-chip"
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                    >
                      {item}
                    </motion.span>
                  ))}
              </div>
              <p className="mt-3 text-sm leading-6 text-foreground/85">{compatibilityPreview.rationale ?? "No rationale yet."}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.section>
  );
};
