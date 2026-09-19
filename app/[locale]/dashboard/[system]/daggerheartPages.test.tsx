import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";

// SPEC-021's public Daggerheart routes: the catalogue layouts (404 outside
// `daggerheart`), the three public lists, the domain and class pages, and
// the subclass route that redirects to its class's page. The views they
// compose have their own tests; this covers what each route adds — the
// system check, the id check, the fetch, the record-link values.

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({ redirect }));
vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

const counts = vi.hoisted(() => ({
  getDhDomainsCount: vi.fn(),
  getDhDomainCardsCount: vi.fn(),
  getDhClassesCount: vi.fn(),
}));
vi.mock("@/app/lib/data/dhDomains/getDhDomainsCount", () => ({
  getDhDomainsCount: counts.getDhDomainsCount,
}));
vi.mock("@/app/lib/data/dhDomainCards/getDhDomainCardsCount", () => ({
  getDhDomainCardsCount: counts.getDhDomainCardsCount,
}));
vi.mock("@/app/lib/data/dhClasses/getDhClassesCount", () => ({
  getDhClassesCount: counts.getDhClassesCount,
}));

vi.mock("@/app/ui/containers/ListPage", () => ({
  ListPage: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <section>
      <h1>{title}</h1>
      {children}
    </section>
  ),
}));
vi.mock("@/app/ui/components/EntityLibrary", () => ({
  default: ({ pageType, system }: { pageType: PageType; system: string }) => (
    <div data-testid="library">
      {pageType}:{system}
    </div>
  ),
}));

const { resolvedValues } = vi.hoisted(() => ({ resolvedValues: vi.fn() }));
vi.mock("@/app/ui/richText/ResolvedRecordLinks", () => ({
  default: ({
    values,
    system,
    children,
  }: {
    values: unknown[];
    system: string;
    children: React.ReactNode;
  }) => {
    resolvedValues(values, system);
    return <>{children}</>;
  },
}));

const fetches = vi.hoisted(() => ({
  fetchDhDomainWithCards: vi.fn(),
  fetchDhClassPage: vi.fn(),
  fetchDhSubclassClassId: vi.fn(),
}));
vi.mock("@/app/lib/data/dhDomains/fetchDhDomainWithCards", () => ({
  default: fetches.fetchDhDomainWithCards,
}));
vi.mock("@/app/lib/data/dhClasses/fetchDhClassPage", () => ({
  default: fetches.fetchDhClassPage,
}));
vi.mock("@/app/lib/data/dhSubclasses/fetchDhSubclassClassId", () => ({
  default: fetches.fetchDhSubclassClassId,
}));
vi.mock("@/app/ui/dhDomains/DhDomainHeader", () => ({
  default: ({ domain }: { domain: { name: string } }) => <h1>{domain.name}</h1>,
}));
vi.mock("@/app/ui/dhDomainCards/DhDomainCardsByLevel", () => ({
  default: ({ cards }: { cards: unknown[] }) => <p>cards:{cards.length}</p>,
}));
vi.mock("@/app/ui/dhClasses/DhClassPageView", () => ({
  default: ({
    page,
    system,
  }: {
    page: { dhClass: { name: string } };
    system: string;
  }) => (
    <h1>
      {page.dhClass.name}:{system}
    </h1>
  ),
}));

import DomainsLayout from "./domains/layout";
import DomainCardsLayout from "./domain-cards/layout";
import ClassesLayout from "./classes/layout";
import SubclassesLayout from "./subclasses/layout";
import DomainsPage, {
  generateMetadata as domainsMetadata,
} from "./domains/page";
import DomainCardsPage, {
  generateMetadata as domainCardsMetadata,
} from "./domain-cards/page";
import ClassesPage, {
  generateMetadata as classesMetadata,
} from "./classes/page";
import DomainPage, {
  generateMetadata as domainMetadata,
} from "./domains/[id]/page";
import ClassPage, {
  generateMetadata as classMetadata,
} from "./classes/[id]/page";
import SubclassRedirect from "./subclasses/[id]/page";

const idParams = (id: string, system = "daggerheart") => ({
  params: Promise.resolve({ locale: "it", system, id }),
  searchParams: Promise.resolve({}),
});

describe("the Daggerheart catalogue layouts (SPEC-021)", () => {
  const layouts = [
    ["domains", DomainsLayout],
    ["domain-cards", DomainCardsLayout],
    ["classes", ClassesLayout],
    ["subclasses", SubclassesLayout],
  ] as const;

  it.each(layouts)("%s renders under daggerheart", async (_, Layout) => {
    await expect(
      Layout({
        params: Promise.resolve({ locale: "it", system: "daggerheart" }),
        children: "page",
      })
    ).resolves.toBe("page");
  });

  it.each(layouts)("%s is a 404 under dnd5e", async (_, Layout) => {
    await expect(
      Layout({
        params: Promise.resolve({ locale: "it", system: "dnd5e" }),
        children: "page",
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("the public Daggerheart lists (SPEC-021 T2, T3, T6)", () => {
  beforeEach(() => {
    for (const count of Object.values(counts)) {
      count.mockReset();
      count.mockResolvedValue({ filtered: 1, total: 1, filteredPages: 1 });
    }
  });

  it.each([
    [DomainsPage, domainsMetadata, counts.getDhDomainsCount, PageType.DhDomain],
    [
      DomainCardsPage,
      domainCardsMetadata,
      counts.getDhDomainCardsCount,
      PageType.DhDomainCard,
    ],
    [ClassesPage, classesMetadata, counts.getDhClassesCount, PageType.DhClass],
  ])(
    "counts with the search params and renders the library (%#)",
    async (Page, metadata, count, pageType) => {
      expect((await metadata()).title).toBe("title");

      render(
        await Page({
          params: Promise.resolve({ system: "daggerheart" }),
          searchParams: Promise.resolve({ query: "lan" }),
        })
      );

      expect(count).toHaveBeenCalledWith({ query: "lan" });
      expect(screen.getByTestId("library")).toHaveTextContent(
        `${pageType}:daggerheart`
      );
    }
  );

  it("counts with no search params as an empty search", async () => {
    render(
      await ClassesPage({ params: Promise.resolve({ system: "daggerheart" }) })
    );

    expect(counts.getDhClassesCount).toHaveBeenCalledWith({});
  });
});

describe("a domain's page (SPEC-021 T2)", () => {
  beforeEach(() => {
    fetches.fetchDhDomainWithCards.mockReset();
  });

  it("renders the domain and resolves the links of its formatted texts", async () => {
    fetches.fetchDhDomainWithCards.mockResolvedValue({
      domain: { name: "Veilwright", description: "<p>D</p>" },
      cards: [{ featureText: "<p>A</p>" }, { featureText: "<p>B</p>" }],
    });

    expect((await domainMetadata()).title).toBe("title");
    render(await DomainPage(idParams("3")));

    expect(fetches.fetchDhDomainWithCards).toHaveBeenCalledWith(3);
    expect(screen.getByRole("heading", { name: "Veilwright" })).toBeVisible();
    expect(screen.getByText("cards:2")).toBeInTheDocument();
    expect(resolvedValues).toHaveBeenLastCalledWith(
      ["<p>D</p>", "<p>A</p>", "<p>B</p>"],
      "daggerheart"
    );
  });

  it("is a 404 for a malformed id, without a query", async () => {
    await expect(DomainPage(idParams("abc"))).rejects.toThrow("NEXT_NOT_FOUND");
    expect(fetches.fetchDhDomainWithCards).not.toHaveBeenCalled();
  });

  it("is a 404 for a domain that does not exist", async () => {
    fetches.fetchDhDomainWithCards.mockResolvedValue(null);

    await expect(DomainPage(idParams("99"))).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("a class's page (SPEC-021 T6)", () => {
  beforeEach(() => {
    fetches.fetchDhClassPage.mockReset();
  });

  it("renders the class and resolves every formatted text on it", async () => {
    fetches.fetchDhClassPage.mockResolvedValue({
      dhClass: {
        name: "Lamplighter",
        description: "<p>d</p>",
        classItems: null,
        hopeFeatureText: "<p>h</p>",
        features: [{ text: "<p>f</p>" }],
      },
      domains: [],
      subclasses: [{ description: null, features: [{ text: "<p>s</p>" }] }],
      cards: [{ featureText: "<p>c</p>" }],
    });

    expect((await classMetadata()).title).toBe("title");
    render(await ClassPage(idParams("7")));

    expect(fetches.fetchDhClassPage).toHaveBeenCalledWith(7);
    expect(
      screen.getByRole("heading", { name: "Lamplighter:daggerheart" })
    ).toBeVisible();
    expect(resolvedValues).toHaveBeenLastCalledWith(
      ["<p>d</p>", null, "<p>h</p>", "<p>f</p>", null, "<p>s</p>", "<p>c</p>"],
      "daggerheart"
    );
  });

  it("is a 404 for a malformed id or a missing class", async () => {
    await expect(ClassPage(idParams("0"))).rejects.toThrow("NEXT_NOT_FOUND");
    expect(fetches.fetchDhClassPage).not.toHaveBeenCalled();

    fetches.fetchDhClassPage.mockResolvedValue(null);
    await expect(ClassPage(idParams("7"))).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("a subclass's route (SPEC-021 T7)", () => {
  beforeEach(() => {
    fetches.fetchDhSubclassClassId.mockReset();
    redirect.mockReset();
  });

  it("redirects to the subclass's heading on its class's page", async () => {
    fetches.fetchDhSubclassClassId.mockResolvedValue(7);

    await SubclassRedirect(idParams("11"));

    expect(fetches.fetchDhSubclassClassId).toHaveBeenCalledWith(11);
    expect(redirect).toHaveBeenCalledWith({
      href: "/dashboard/daggerheart/classes/7#subclass-11",
      locale: "it",
    });
  });

  it("is a 404 for a malformed id or a missing subclass", async () => {
    await expect(SubclassRedirect(idParams("-1"))).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(fetches.fetchDhSubclassClassId).not.toHaveBeenCalled();

    fetches.fetchDhSubclassClassId.mockResolvedValue(null);
    await expect(SubclassRedirect(idParams("11"))).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(redirect).not.toHaveBeenCalled();
  });
});
