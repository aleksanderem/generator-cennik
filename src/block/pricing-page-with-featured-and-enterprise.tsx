import { cn } from "@/lib/utils";
import { IconCheck, IconPlus } from "@tabler/icons-react";
import React from "react";

export type Plan = {
  id: string;
  description: string;
  name: string;
  priceId: string; // Stripe price ID or DodoPayments product ID
  finalPrice: number;
  actualPrice: number;
  currency: string;
  features: string[];
  credits: number;
  platformCredits?: number;
  creditType?: "ai" | "platform";
  featured?: boolean;
  buttonText?: string;
  thumbnail?: string;
  additionalFeatures?: string[];
};

export const planIds = {
  starter: "starter",
  pro: "pro",
  business: "business",
  enterprise: "enterprise",
};

const plans: Array<Plan> = [
  {
    id: planIds.starter,
    description: "For small businesses and startups",
    name: "Starter",
    priceId: "",
    finalPrice: 19,
    actualPrice: 30,
    credits: 3000000,
    platformCredits: 20, // 20 Hours of platform credits
    currency: "usd",
    features: [
      "3M AI Credits",
      "20 Hours of platform credits",
      "10 Projects",
      "Access to all Pro Component Blocks",
      "Access to all Pro Templates",
    ],
    buttonText: "Get Started",
  },
  {
    id: planIds.pro,
    description: "For growing businesses",
    name: "Premium",
    priceId: "",
    finalPrice: 49,
    actualPrice: 60,
    credits: 8000000,
    platformCredits: 50, // 50 Hours of platform credits
    currency: "usd",
    features: [
      "8M AI Credits",
      "50 Hours of Platform Credits",
      "20 Projects",
      "Access to all Pro Component Blocks",
      "Access to all Pro Templates",
    ],
    buttonText: "Get Started",
    featured: true,
  },
  {
    id: planIds.business,
    description: "For established businesses",
    name: "Business",
    priceId: "",
    finalPrice: 99,
    actualPrice: 120,
    credits: 20000000,
    platformCredits: 75, // 75 Hours of platform credits
    currency: "usd",
    features: [
      "20M AI Credits",
      "75 Hours of Platform Credits",
      "Unlimited Projects",
      "Access to all Pro Component Blocks",
      "Access to all Pro Templates",
    ],
    buttonText: "Get Started",
  },
];

export default function PricingPageWithFeaturedAndEnterprise() {
  return (
    <main className="flex min-h-screen flex-col bg-neutral-100 dark:bg-neutral-950">
      <div className="relative mx-auto my-12 flex w-full max-w-7xl flex-1 flex-col px-4 py-0 sm:my-10 md:my-20 lg:px-4">
        <h1 className="pt-4 text-center text-2xl font-bold tracking-tight text-neutral-800 md:text-4xl dark:text-neutral-100">
          Choose your Pricing Plan
        </h1>
        <p className="mx-auto mt-4 max-w-md text-center text-base text-neutral-600 dark:text-neutral-300">
          Get started with our flexible pricing plans designed to scale with
          your business needs.
        </p>

        <div className="py-4 md:py-10">
          <Pricing />
        </div>
      </div>
    </main>
  );
}

export function Pricing() {
  return (
    <div className="grid w-full grid-cols-1 gap-2 p-4 sm:gap-3 md:grid-cols-2 md:gap-4 md:p-8 lg:grid-cols-3">
      {plans.map((tier, tierIdx) => {
        return <Card plan={tier} key={tier.id} />;
      })}
      {/* Enterprise Customer Card */}
      <div className="col-span-1 mt-8 md:col-span-2 lg:col-span-3">
        <div className="relative overflow-hidden rounded-sm border border-neutral-200 p-6 md:p-8 dark:border-neutral-800">
          <div className="grid grid-cols-1 gap-20 lg:grid-cols-3">
            {/* Enterprise Plan Info - 1/3 */}
            <div className="lg:col-span-1">
              <h3 className="mb-2 text-base font-medium text-neutral-900 md:text-2xl dark:text-neutral-100">
                Plan for organizations
              </h3>
              <p className="mb-6 text-sm text-neutral-600 md:text-sm dark:text-neutral-400">
                Need custom solutions, dedicated support, or volume pricing?
                Let&apos;s discuss a plan tailored specifically for your
                organization.
              </p>
              <button className="w-full rounded-sm bg-white px-6 py-3 font-medium text-black shadow-lg ring-1 ring-black/10 transition-colors hover:bg-neutral-100 sm:w-auto dark:bg-white dark:text-black dark:ring-white/10 dark:hover:bg-neutral-200">
                Contact Sales
              </button>
            </div>

            {/* Steps and Features - 2/3 */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-3">
                <Step className="my-2">Unlimited projects</Step>
                <Step className="my-2">No capping on tokens</Step>
                <Step className="my-2">No capping on sandbox usage</Step>
                <Step className="my-2">Team support</Step>
                <Step className="my-2">Invite members</Step>
                <Step className="my-2">Custom user roles</Step>
                <Step className="my-2">Custom invoicing</Step>
                <Step className="my-2">Standard security features</Step>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Card = ({ plan }: { plan: Plan }) => {
  return (
    <div
      className={cn(
        "rounded-sm bg-transparent p-1 sm:p-2 md:p-3 dark:bg-neutral-950",
        plan.featured &&
          "border border-transparent bg-white shadow ring shadow-black/10 ring-black/5 dark:bg-neutral-800",
      )}
    >
      <div className="flex h-full flex-col justify-start gap-1 p-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <p
              className={cn(
                "text-base font-medium text-black sm:text-lg dark:text-white",
              )}
            >
              {plan.name}
            </p>
          </div>
        </div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {plan.description}
        </p>
        <div className="my-6">
          <div className="flex items-end">
            <div className="flex items-start gap-1">
              <span
                className={cn(
                  "text-3xl font-medium text-neutral-800 md:text-4xl dark:text-neutral-50",
                )}
              >
                ${plan?.finalPrice}
              </span>
            </div>
          </div>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            Per month
          </span>
        </div>
        <button
          className={cn(
            "mt-4 mb-2 w-full cursor-pointer rounded-sm px-2 py-1.5 transition duration-200 active:scale-[0.98] md:w-full",
            "border border-transparent bg-white shadow ring shadow-black/15 ring-black/10 dark:bg-neutral-900",
            plan.featured &&
              "bg-black text-white dark:bg-white dark:text-black",
          )}
        >
          {plan.buttonText}
        </button>
        <div className="mt-1">
          {plan.features.map((feature, idx) => (
            <Step key={idx}>{feature}</Step>
          ))}
        </div>
        {plan.additionalFeatures && plan.additionalFeatures.length > 0 && (
          <Divider />
        )}
        <div className="p-3">
          {plan.additionalFeatures?.map((feature, idx) => (
            <Step additional key={idx}>
              {feature}
            </Step>
          ))}
        </div>
      </div>
    </div>
  );
};

const Step = ({
  children,
  additional,
  className,
}: {
  children: React.ReactNode;
  additional?: boolean;
  featured?: boolean;
  className?: string;
}) => {
  return (
    <div className={cn("my-5 flex items-start justify-start gap-2", className)}>
      <div
        className={cn(
          "mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-neutral-700",
          additional ? "bg-sky-500" : "bg-neutral-700",
        )}
      >
        <IconCheck className="h-3 w-3 [stroke-width:4px] text-neutral-300" />
      </div>
      <div
        className={cn(
          "text-sm font-medium text-neutral-600 dark:text-neutral-400",
        )}
      >
        {children}
      </div>
    </div>
  );
};

const Divider = () => {
  return (
    <div className="relative">
      <div className={cn("h-px w-full bg-white dark:bg-neutral-950")} />
      <div className={cn("h-px w-full bg-neutral-200 dark:bg-neutral-800")} />
      <div
        className={cn(
          "absolute inset-0 m-auto flex h-5 w-5 items-center justify-center rounded-xl bg-white shadow-[0px_-1px_0px_0px_var(--neutral-200)] dark:bg-neutral-800 dark:shadow-[0px_-1px_0px_0px_var(--neutral-700)]",
        )}
      >
        <IconPlus
          className={cn(
            "h-3 w-3 [stroke-width:4px] text-black dark:text-neutral-300",
          )}
        />
      </div>
    </div>
  );
};
