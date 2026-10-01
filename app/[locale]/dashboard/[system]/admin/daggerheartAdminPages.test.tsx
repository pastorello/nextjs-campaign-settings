import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";

// SPEC-021's Daggerheart admin routes: the four list pages (the admin
// list-page pattern `admin/spells/page.test.tsx` covers for 5e), their
// layouts, and the four "new" pages with their client forms, which return
// to the list on cancel and on save.

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/app/lib/hooks/useGameSystem", () => ({
  default: () => "daggerheart",
}));

const counts = vi.hoisted(() => ({
  getDhDomainsCount: vi.fn(),
  getDhDomainCardsCount: vi.fn(),
  getDhClassesCount: vi.fn(),
  getDhSubclassesCount: vi.fn(),
  getDhAncestriesCount: vi.fn(),
  getDhCommunitiesCount: vi.fn(),
  getDhAdversariesCount: vi.fn(),
  getDhEnvironmentsCount: vi.fn(),
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
vi.mock("@/app/lib/data/dhSubclasses/getDhSubclassesCount", () => ({
  getDhSubclassesCount: counts.getDhSubclassesCount,
}));
vi.mock("@/app/lib/data/dhAncestries/getDhAncestriesCount", () => ({
  getDhAncestriesCount: counts.getDhAncestriesCount,
}));
vi.mock("@/app/lib/data/dhCommunities/getDhCommunitiesCount", () => ({
  getDhCommunitiesCount: counts.getDhCommunitiesCount,
}));
vi.mock("@/app/lib/data/dhAdversaries/getDhAdversariesCount", () => ({
  getDhAdversariesCount: counts.getDhAdversariesCount,
}));
vi.mock("@/app/lib/data/dhEnvironments/getDhEnvironmentsCount", () => ({
  getDhEnvironmentsCount: counts.getDhEnvironmentsCount,
}));
const { fetchFieldOptions } = vi.hoisted(() => ({
  fetchFieldOptions: vi.fn(),
}));
vi.mock("@/app/lib/data/options/fetchFieldOptions", () => ({
  default: fetchFieldOptions,
}));

vi.mock("@/app/ui/typography/PageTitle", () => ({
  default: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
}));
vi.mock("@/app/ui/containers/AdminListHeader", () => ({
  default: ({
    countText,
    newItemHref,
  }: {
    countText: string;
    newItemHref: string;
  }) => (
    <a href={newItemHref} data-testid="new-item">
      {countText}
    </a>
  ),
}));
vi.mock("@/app/ui/components/EntityList", () => ({
  default: ({ pageType }: { pageType: PageType }) => (
    <div data-testid="entity-list">{pageType}</div>
  ),
}));
vi.mock("@/app/ui/components/pagination", () => ({
  default: ({ totalPages }: { totalPages: number }) => (
    <div data-testid="pagination">{totalPages}</div>
  ),
}));

// Each domain form, reduced to what the new page hands it.
const { formStub } = vi.hoisted(() => ({
  formStub:
    (name: string) =>
    ({
      optionBundle,
      onCancel,
      onSaveFinished,
    }: {
      optionBundle?: Record<string, { label: string }[]>;
      onCancel: () => void;
      onSaveFinished: () => void;
    }) => (
      <div>
        <p>
          {name}:{Object.keys(optionBundle ?? {}).join(",")}
        </p>
        <button onClick={onCancel}>cancel</button>
        <button onClick={onSaveFinished}>saved</button>
      </div>
    ),
}));
vi.mock("@/app/ui/dhDomains/DhDomainForm", () => ({
  default: formStub("DhDomainForm"),
}));
vi.mock("@/app/ui/dhDomainCards/DhDomainCardForm", () => ({
  default: formStub("DhDomainCardForm"),
}));
vi.mock("@/app/ui/dhClasses/DhClassForm", () => ({
  default: formStub("DhClassForm"),
}));
vi.mock("@/app/ui/dhSubclasses/DhSubclassForm", () => ({
  default: formStub("DhSubclassForm"),
}));
vi.mock("@/app/ui/dhAncestries/DhAncestryForm", () => ({
  default: formStub("DhAncestryForm"),
}));
vi.mock("@/app/ui/dhCommunities/DhCommunityForm", () => ({
  default: formStub("DhCommunityForm"),
}));
vi.mock("@/app/ui/dhAdversaries/DhAdversaryForm", () => ({
  default: formStub("DhAdversaryForm"),
}));
vi.mock("@/app/ui/dhEnvironments/DhEnvironmentForm", () => ({
  default: formStub("DhEnvironmentForm"),
}));

import DomainsLayout from "./domains/layout";
import DomainCardsLayout from "./domain-cards/layout";
import ClassesLayout from "./classes/layout";
import SubclassesLayout from "./subclasses/layout";
import AncestriesLayout from "./ancestries/layout";
import CommunitiesLayout from "./communities/layout";
import AdversariesLayout from "./adversaries/layout";
import EnvironmentsLayout from "./environments/layout";
import DomainsPage, {
  generateMetadata as domainsMetadata,
} from "./domains/page";
import DomainCardsPage, {
  generateMetadata as domainCardsMetadata,
} from "./domain-cards/page";
import ClassesPage, {
  generateMetadata as classesMetadata,
} from "./classes/page";
import SubclassesPage, {
  generateMetadata as subclassesMetadata,
} from "./subclasses/page";
import NewDomainPage from "./domains/new/page";
import NewDomainCardPage from "./domain-cards/new/page";
import NewClassPage from "./classes/new/page";
import NewSubclassPage from "./subclasses/new/page";
import AncestriesPage, {
  generateMetadata as ancestriesMetadata,
} from "./ancestries/page";
import NewAncestryPage from "./ancestries/new/page";
import CommunitiesPage, {
  generateMetadata as communitiesMetadata,
} from "./communities/page";
import NewCommunityPage from "./communities/new/page";
import AdversariesPage, {
  generateMetadata as adversariesMetadata,
} from "./adversaries/page";
import NewAdversaryPage from "./adversaries/new/page";
import EnvironmentsPage, {
  generateMetadata as environmentsMetadata,
} from "./environments/page";
import NewEnvironmentPage from "./environments/new/page";

describe("the Daggerheart admin layouts (SPEC-021)", () => {
  const layouts = [
    ["domains", DomainsLayout],
    ["domain-cards", DomainCardsLayout],
    ["classes", ClassesLayout],
    ["subclasses", SubclassesLayout],
    ["ancestries", AncestriesLayout],
    ["communities", CommunitiesLayout],
    ["adversaries", AdversariesLayout],
    ["environments", EnvironmentsLayout],
  ] as const;

  it.each(layouts)("%s renders under daggerheart only", async (_, Layout) => {
    const run = (system: string) =>
      Layout({
        params: Promise.resolve({ locale: "it", system }),
        children: "page",
      });

    await expect(run("daggerheart")).resolves.toBe("page");
    await expect(run("dnd5e")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("the Daggerheart admin lists (SPEC-021 T2–T5)", () => {
  beforeEach(() => {
    for (const count of Object.values(counts)) {
      count.mockReset();
      count.mockResolvedValue({ filtered: 2, total: 5, filteredPages: 3 });
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
    [
      SubclassesPage,
      subclassesMetadata,
      counts.getDhSubclassesCount,
      PageType.DhSubclass,
    ],
    [
      AncestriesPage,
      ancestriesMetadata,
      counts.getDhAncestriesCount,
      PageType.DhAncestry,
    ],
    [
      CommunitiesPage,
      communitiesMetadata,
      counts.getDhCommunitiesCount,
      PageType.DhCommunity,
    ],
    [
      AdversariesPage,
      adversariesMetadata,
      counts.getDhAdversariesCount,
      PageType.DhAdversary,
    ],
    [
      EnvironmentsPage,
      environmentsMetadata,
      counts.getDhEnvironmentsCount,
      PageType.DhEnvironment,
    ],
  ])(
    "counts, links the new form and lists its rows (%#)",
    async (Page, metadata, count, pageType) => {
      expect((await metadata()).title).toBe("title");

      render(
        await Page({
          params: Promise.resolve({ system: "daggerheart" }),
          searchParams: Promise.resolve({ query: "lan", page: "2" }),
        })
      );

      expect(count).toHaveBeenCalledWith({ query: "lan", page: "2" });
      expect(screen.getByTestId("new-item")).toHaveAttribute(
        "href",
        `${pageType}/new`
      );
      expect(screen.getByTestId("entity-list")).toHaveTextContent(pageType);
      expect(screen.getByTestId("pagination")).toHaveTextContent("3");
    }
  );

  it("treats missing search params as an empty search", async () => {
    render(
      await SubclassesPage({
        params: Promise.resolve({ system: "daggerheart" }),
      })
    );

    expect(counts.getDhSubclassesCount).toHaveBeenCalledWith({});
  });
});

describe("the Daggerheart new-record pages (SPEC-021 T2–T5)", () => {
  beforeEach(() => {
    push.mockReset();
    fetchFieldOptions.mockReset();
    fetchFieldOptions.mockResolvedValue([{ value: 1, label: "Veilwright" }]);
  });

  it.each([
    [
      "DhDomainForm",
      () => Promise.resolve(NewDomainPage()),
      "",
      "/admin/domains",
    ],
    ["DhDomainCardForm", NewDomainCardPage, "dhDomain", "/admin/domain-cards"],
    ["DhClassForm", NewClassPage, "dhDomain", "/admin/classes"],
    ["DhSubclassForm", NewSubclassPage, "dhClass", "/admin/subclasses"],
    [
      "DhAncestryForm",
      () => Promise.resolve(NewAncestryPage()),
      "",
      "/admin/ancestries",
    ],
    [
      "DhAdversaryForm",
      () => Promise.resolve(NewAdversaryPage()),
      "",
      "/admin/adversaries",
    ],
  ])(
    "%s gets its options and returns to its list on cancel and on save",
    async (form, Page, table, listPath) => {
      render(await Page());

      expect(screen.getByText(`${form}:${table}`)).toBeInTheDocument();
      if (table) expect(fetchFieldOptions).toHaveBeenCalledWith(table);

      fireEvent.click(screen.getByRole("button", { name: "cancel" }));
      fireEvent.click(screen.getByRole("button", { name: "saved" }));
      expect(push.mock.calls).toEqual([
        [`/dashboard/daggerheart${listPath}`],
        [`/dashboard/daggerheart${listPath}`],
      ]);
    }
  );
});

// SPEC-027 T3: a community's form offers places and factions.
describe("the new-community page (SPEC-027 T3)", () => {
  beforeEach(() => {
    push.mockReset();
    fetchFieldOptions.mockReset();
    fetchFieldOptions.mockResolvedValue([{ value: 1, label: "Aerivel" }]);
  });

  it("loads the place and faction options, and returns to its list", async () => {
    render(await NewCommunityPage());

    expect(fetchFieldOptions).toHaveBeenCalledWith("zone");
    expect(fetchFieldOptions).toHaveBeenCalledWith("faction");
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    expect(push).toHaveBeenCalledWith(
      "/dashboard/daggerheart/admin/communities"
    );
  });
});

// SPEC-028 T3: an environment's form offers adversaries and places.
describe("the new-environment page (SPEC-028 T3)", () => {
  beforeEach(() => {
    push.mockReset();
    fetchFieldOptions.mockReset();
    fetchFieldOptions.mockResolvedValue([{ value: 1, label: "Aerivel" }]);
  });

  it("loads the adversary and place options, and returns to its list", async () => {
    render(await NewEnvironmentPage());

    expect(fetchFieldOptions).toHaveBeenCalledWith("dhAdversary");
    expect(fetchFieldOptions).toHaveBeenCalledWith("zone");
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    expect(push).toHaveBeenCalledWith(
      "/dashboard/daggerheart/admin/environments"
    );
  });
});
