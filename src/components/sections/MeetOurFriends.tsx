"use client";

import Link from "next/link";

import PremiumSectionBackdrop from "../ui/PremiumSectionBackdrop";
import MotionSection from "../ui/MotionSection";
import Reveal from "../ui/Reveal";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import AccentBar from "../ui/AccentBar";
import Button from "../ui/Button";
import { Mascot, type MascotPose, type MascotType } from "../mascots";
import { mascotFloatDuration, mascotLabel } from "../../lib/mascots";
import { MASCOTS } from "@/lib/brand/copy";
import type { MascotsConfig } from "@/lib/admin/homepage-schema";

type Friend = {
  mascot: MascotType;
  pose: MascotPose;
  name: string;
  role: string;
  description: string;
  cta: string;
  delay: number;
};

const DEFAULT_FRIENDS: Friend[] = [
  {
    mascot: "bella-bunny",
    pose: "welcome",
    name: "Bella Bunny",
    role: "Warm welcomes",
    description: "Reminds us that every product should feel as gentle as a first hello.",
    cta: "Meet Bella",
    delay: 0.34,
  },
  {
    mascot: "gigi-giraffe",
    pose: "reading",
    name: "Gigi Giraffe",
    role: "Learning guide",
    description: "Helps families understand ingredients without the jargon.",
    cta: "Meet Gigi",
    delay: 0.42,
  },
  {
    mascot: "poppy-panda",
    pose: "sleeping",
    name: "Poppy Panda",
    role: "Calm routines",
    description: "Celebrates the quiet rituals — bath time, bedtime, and in-between.",
    cta: "Meet Poppy",
    delay: 0.5,
  },
  {
    mascot: "eli-elephant",
    pose: "reading",
    name: "Eli Elephant",
    role: "Research guide",
    description: "Turns formulation science into stories parents can trust.",
    cta: "Meet Eli",
    delay: 0.58,
  },
  {
    mascot: "penny-penguin",
    pose: "hold-product",
    name: "Penny Penguin",
    role: "Product guide",
    description: "Introduces each formula with clarity and a little delight.",
    cta: "Meet Penny",
    delay: 0.66,
  },
  {
    mascot: "benny-bear",
    pose: "celebration",
    name: "Benny Bear",
    role: "Everyday joy",
    description: "Marks the small milestones that make parenthood beautiful.",
    cta: "Meet Benny",
    delay: 0.74,
  },
];

const MASCOT_ROLES: Partial<Record<MascotType, string>> = {
  "bella-bunny": "Brand Ambassador",
  "gigi-giraffe": "Learning Guide",
  "poppy-panda": "Sleep Expert",
  "eli-elephant": "Research Expert",
  "penny-penguin": "Product Guide",
  "benny-bear": "Fun Companion",
  "freddy-ferret": "Fun Companion",
};

function resolveFriends(config?: MascotsConfig): Friend[] {
  const cmsItems = config?.items?.filter((item) => item.visible !== false) ?? [];
  if (cmsItems.length === 0) return DEFAULT_FRIENDS;

  return cmsItems.map((item, index) => {
    const fallback = DEFAULT_FRIENDS.find((f) => f.mascot === item.mascot);
    const name = mascotLabel(item.mascot);
    return {
      mascot: item.mascot,
      pose: item.pose || fallback?.pose || "welcome",
      name,
      role: MASCOT_ROLES[item.mascot] ?? "Friend",
      description: item.description?.trim() || fallback?.description || "",
      cta: fallback ? fallback.cta : `Meet ${name.split(" ")[0]}`,
      delay: 0.34 + index * 0.08,
    };
  });
}

function renderHeading(text: string) {
  if (text.includes("\n")) {
    return text.split("\n").map((line, i, arr) => (
      <span key={`${line}-${i}`}>
        {line}
        {i < arr.length - 1 ? <br /> : null}
      </span>
    ));
  }
  return text;
}

export default function MeetOurFriends({ config }: { config?: MascotsConfig }) {
  const heading = config?.heading?.trim() || MASCOTS.heading;
  const friends = resolveFriends(config);

  return (
    <MotionSection as="section" id="mascots" variant="fadeUp" className="section-padding relative overflow-hidden">
      <PremiumSectionBackdrop variant="cream" />
      <div className="container relative z-10 w-full">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Reveal as="div" variant="fadeUp" delay={0} className="section-eyebrow">
            <Badge variant="default" size="md">
              {MASCOTS.eyebrow}
            </Badge>
          </Reveal>

          <Reveal as="div" variant="fadeUp" delay={0.1} className="w-full">
            <h2 className="section-heading">{renderHeading(heading)}</h2>
          </Reveal>

          <Reveal as="div" variant="fadeUp" delay={0.18} className="section-intro">
            <AccentBar width="lg" align="center" />
          </Reveal>

          <Reveal as="div" variant="fadeUp" delay={0.26} className="section-intro w-full">
            <p className="section-subcopy prose-width mx-auto">
              {MASCOTS.intro}
            </p>
          </Reveal>
        </div>

        <div className="section-grid-gap grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {friends.map((friend) => (
            <Reveal
              key={friend.mascot}
              as="div"
              variant="fadeUp"
              delay={friend.delay}
              className="w-full"
            >
              <Card
                as="div"
                variant="glass"
                radius="4xl"
                padding="lg"
                hover
                fullHeight
                className="flex flex-col items-center text-center"
              >
                <Mascot
                  mascot={friend.mascot}
                  pose={friend.pose}
                  size={220}
                  animated
                  floating
                  interactive
                  duration={mascotFloatDuration(friend.mascot)}
                  alt={`${friend.name} mascot`}
                />

                <h3 className="mt-5 font-heading text-[clamp(1.5rem,2.5vw,1.875rem)] font-bold leading-tight text-green-800">
                  {friend.name}
                </h3>

                <div className="mt-3">
                  <Badge variant="default" size="md">
                    {friend.role}
                  </Badge>
                </div>

                <p className="mt-4 font-body text-base leading-relaxed text-green-700/90">
                  {friend.description}
                </p>

                <div className="mt-auto w-full pt-6">
                  <Link href="/products">
                    <Button variant="primary" fullWidth type="button">
                      {friend.cta}
                    </Button>
                  </Link>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
