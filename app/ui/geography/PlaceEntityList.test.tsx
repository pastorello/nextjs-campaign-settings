import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const { fetchEntitiesAtPlace, assignNpcLocation, assignDeityLocation } =
  vi.hoisted(() => ({
    fetchEntitiesAtPlace: vi.fn(),
    assignNpcLocation: vi.fn(),
    assignDeityLocation: vi.fn(),
  }));
vi.mock("@/app/lib/data/maps/fetchEntitiesAtPlace", () => ({
  default: fetchEntitiesAtPlace,
}));
vi.mock("@/app/lib/data/npc/assignLocation", () => ({
  default: assignNpcLocation,
}));
vi.mock("@/app/lib/data/deities/assignLocation", () => ({
  default: assignDeityLocation,
}));

const { notifyError } = vi.hoisted(() => ({ notifyError: vi.fn() }));
vi.mock("@/app/lib/notifications/notify", () => ({ notifyError }));

import PlaceEntityList from "./PlaceEntityList";

const entities = [
  { id: 3, name: "Aelar", type: "npc" as const },
  { id: 5, name: "Tyr", type: "deity" as const },
];

function rowFor(name: string) {
  const row = screen.getByText(name).closest("li");
  if (row === null) throw new Error(`No row rendered for ${name}`);
  return within(row);
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchEntitiesAtPlace.mockResolvedValue(entities);
  assignNpcLocation.mockResolvedValue({ ok: true });
  assignDeityLocation.mockResolvedValue({ ok: true });
});

describe("PlaceEntityList", () => {
  it("lists the entities attached to a zone", async () => {
    render(<PlaceEntityList target={{ zoneId: 7 }} />);

    expect(await screen.findByText("Aelar")).toBeInTheDocument();
    expect(screen.getByText("Tyr")).toBeInTheDocument();
    expect(fetchEntitiesAtPlace).toHaveBeenCalledWith({ zoneId: 7 });
  });

  it("lists the entities attached to a landmark", async () => {
    render(<PlaceEntityList target={{ poiId: 12 }} />);

    expect(await screen.findByText("Aelar")).toBeInTheDocument();
    expect(fetchEntitiesAtPlace).toHaveBeenCalledWith({ poiId: 12 });
  });

  it("shows an empty state rather than nothing when no entity is attached", async () => {
    fetchEntitiesAtPlace.mockResolvedValue([]);

    render(<PlaceEntityList target={{ zoneId: 7 }} />);

    expect(await screen.findByText("entitiesEmpty")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("does not flash the empty state while the entities are still loading", () => {
    fetchEntitiesAtPlace.mockReturnValue(new Promise(() => {}));

    render(<PlaceEntityList target={{ zoneId: 7 }} />);

    expect(screen.queryByText("entitiesEmpty")).not.toBeInTheDocument();
  });

  it("detaches an NPC back to the unattached pool, clearing both references", async () => {
    render(<PlaceEntityList target={{ zoneId: 7 }} />);
    await screen.findByText("Aelar");

    fireEvent.click(rowFor("Aelar").getByLabelText("detach"));

    expect(assignNpcLocation).toHaveBeenCalledWith({
      id: 3,
      zoneId: null,
      poiId: null,
    });
    expect(assignDeityLocation).not.toHaveBeenCalled();
  });

  it("detaches a deity through the deity mutation", async () => {
    render(<PlaceEntityList target={{ zoneId: 7 }} />);
    await screen.findByText("Tyr");

    fireEvent.click(rowFor("Tyr").getByLabelText("detach"));

    expect(assignDeityLocation).toHaveBeenCalledWith({
      id: 5,
      zoneId: null,
      poiId: null,
    });
  });

  it("detaching from a landmark clears the zone reference too, not just the landmark's", async () => {
    render(<PlaceEntityList target={{ poiId: 12 }} />);
    await screen.findByText("Aelar");

    fireEvent.click(rowFor("Aelar").getByLabelText("detach"));

    expect(assignNpcLocation).toHaveBeenCalledWith({
      id: 3,
      zoneId: null,
      poiId: null,
    });
  });

  it("drops the detached row from the list without refetching", async () => {
    render(<PlaceEntityList target={{ zoneId: 7 }} />);
    await screen.findByText("Aelar");
    fetchEntitiesAtPlace.mockClear();

    fireEvent.click(rowFor("Aelar").getByLabelText("detach"));

    await waitFor(() =>
      expect(screen.queryByText("Aelar")).not.toBeInTheDocument()
    );
    expect(screen.getByText("Tyr")).toBeInTheDocument();
    expect(fetchEntitiesAtPlace).not.toHaveBeenCalled();
  });

  it("falls back to the empty state once the last entity is detached", async () => {
    fetchEntitiesAtPlace.mockResolvedValue([entities[0]]);
    render(<PlaceEntityList target={{ zoneId: 7 }} />);
    await screen.findByText("Aelar");

    fireEvent.click(rowFor("Aelar").getByLabelText("detach"));

    expect(await screen.findByText("entitiesEmpty")).toBeInTheDocument();
  });

  it("keeps the row and reports the failure when the mutation is rejected", async () => {
    assignNpcLocation.mockResolvedValue({
      ok: false,
      errors: { id: ["Invalid"] },
    });
    render(<PlaceEntityList target={{ zoneId: 7 }} />);
    await screen.findByText("Aelar");

    fireEvent.click(rowFor("Aelar").getByLabelText("detach"));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("errors.detachFailed")
    );
    expect(screen.getByText("Aelar")).toBeInTheDocument();
  });

  it("keeps the row and reports the failure when the mutation throws", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    assignNpcLocation.mockRejectedValue(new Error("boom"));
    render(<PlaceEntityList target={{ zoneId: 7 }} />);
    await screen.findByText("Aelar");

    fireEvent.click(rowFor("Aelar").getByLabelText("detach"));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("errors.detachFailed")
    );
    expect(screen.getByText("Aelar")).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it("reports a failed load and renders the empty state rather than a stale list", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    fetchEntitiesAtPlace.mockRejectedValue(new Error("boom"));

    render(<PlaceEntityList target={{ zoneId: 7 }} />);

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("errors.loadEntitiesFailed")
    );
    expect(screen.getByText("entitiesEmpty")).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
