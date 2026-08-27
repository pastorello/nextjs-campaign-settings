import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Isolates this suite from Modal's own animation/Dialog machinery (its own
// suite covers that) — mirrors ModalButton.test.tsx's approach.
vi.mock("@/app/ui/components/Modal", () => ({
  default: ({
    isOpen,
    children,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
  }) => (isOpen ? <div>{children}</div> : null),
}));

// A plain <select> stand-in — Select's own Listbox rendering has its own
// suite; this one only needs to drive onChange with a numeric value.
vi.mock("@/app/ui/forms/inputs/Select", () => ({
  default: ({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value: number | string;
    onChange: (value: number) => void;
    options: { value: number; label: string }[];
  }) => (
    <select
      aria-label={label}
      value={String(value)}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

const { fetchZones, fetchZoneLandmarks } = vi.hoisted(() => ({
  fetchZones: vi.fn(),
  fetchZoneLandmarks: vi.fn(),
}));
vi.mock("@/app/lib/data/maps/fetchZones", () => ({ default: fetchZones }));
vi.mock("@/app/lib/data/maps/fetchZoneLandmarks", () => ({
  default: fetchZoneLandmarks,
}));

import AssignLocationModal from "./AssignLocationModal";

describe("AssignLocationModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchZones.mockResolvedValue([{ id: 5, title: "Skreebars" }]);
    fetchZoneLandmarks.mockResolvedValue([
      { id: 9, title: "Locanda del Cinghiale Rosso" },
    ]);
  });

  it("fetches nothing while closed", () => {
    render(
      <AssignLocationModal
        isOpen={false}
        onClose={vi.fn()}
        entityId={1}
        currentZoneId={null}
        currentPoiId={null}
        currentLocationLabel="Sconosciuta"
        assignAction={vi.fn()}
      />
    );

    expect(fetchZones).not.toHaveBeenCalled();
  });

  it("loads zones on open and assigns a zone with no poi", async () => {
    const assignAction = vi.fn().mockResolvedValue({ ok: true });
    const onAssigned = vi.fn();
    const onClose = vi.fn();

    render(
      <AssignLocationModal
        isOpen
        onClose={onClose}
        entityId={1}
        currentZoneId={null}
        currentPoiId={null}
        currentLocationLabel="Sconosciuta"
        assignAction={assignAction}
        onAssigned={onAssigned}
      />
    );

    await waitFor(() => expect(fetchZones).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText("zoneLabel"), {
      target: { value: "5" },
    });

    fireEvent.click(screen.getByText("save"));

    await waitFor(() =>
      expect(assignAction).toHaveBeenCalledWith({
        id: 1,
        zoneId: 5,
        poiId: null,
      })
    );
    expect(onAssigned).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("scopes the poi list to the selected zone and assigns a poi", async () => {
    const assignAction = vi.fn().mockResolvedValue({ ok: true });

    render(
      <AssignLocationModal
        isOpen
        onClose={vi.fn()}
        entityId={1}
        currentZoneId={5}
        currentPoiId={null}
        currentLocationLabel="Sconosciuta"
        assignAction={assignAction}
      />
    );

    await waitFor(() => expect(fetchZoneLandmarks).toHaveBeenCalledWith(5));

    fireEvent.change(screen.getByLabelText("poiLabel"), {
      target: { value: "9" },
    });
    fireEvent.click(screen.getByText("save"));

    await waitFor(() =>
      expect(assignAction).toHaveBeenCalledWith({
        id: 1,
        zoneId: 5,
        poiId: 9,
      })
    );
  });

  it("shows field errors and does not close on a rejected mutation", async () => {
    const assignAction = vi
      .fn()
      .mockResolvedValue({ ok: false, errors: { zoneId: ["bad"] } });
    const onClose = vi.fn();

    render(
      <AssignLocationModal
        isOpen
        onClose={onClose}
        entityId={1}
        currentZoneId={5}
        currentPoiId={null}
        currentLocationLabel="Sconosciuta"
        assignAction={assignAction}
      />
    );

    fireEvent.click(screen.getByText("save"));

    await waitFor(() => expect(assignAction).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows the placement refusal from the catalogue, not the data layer's prose (TD-93)", async () => {
    const assignAction = vi.fn().mockResolvedValue({
      ok: false,
      code: "alreadyPlaced",
      errors: {
        zoneId: [
          "This NPC is already at a location. Remove it from there first.",
        ],
      },
    });

    render(
      <AssignLocationModal
        isOpen
        onClose={vi.fn()}
        entityId={1}
        currentZoneId={5}
        currentPoiId={null}
        currentLocationLabel="Sconosciuta"
        assignAction={assignAction}
      />
    );

    fireEvent.click(screen.getByText("save"));

    await waitFor(() => expect(assignAction).toHaveBeenCalled());
    expect(screen.getByText(/alreadyPlaced/)).toBeInTheDocument();
    // The mutation's own English message never reaches the DM: it is a
    // developer-facing string, and this app ships bilingual (ADR-0006).
    expect(screen.queryByText(/already at a location/)).toBeNull();
  });

  it("clears the location through the none option — TD-93's recovery path", async () => {
    const assignAction = vi.fn().mockResolvedValue({ ok: true });

    render(
      <AssignLocationModal
        isOpen
        onClose={vi.fn()}
        entityId={1}
        currentZoneId={5}
        currentPoiId={9}
        currentLocationLabel="Skreebars"
        assignAction={assignAction}
      />
    );

    await waitFor(() => expect(fetchZones).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText("zoneLabel"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByText("save"));

    await waitFor(() =>
      expect(assignAction).toHaveBeenCalledWith({
        id: 1,
        zoneId: null,
        poiId: null,
      })
    );
  });
});
