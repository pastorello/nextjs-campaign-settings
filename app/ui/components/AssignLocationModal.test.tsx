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

const { createPlaceFromPicker } = vi.hoisted(() => ({
  createPlaceFromPicker: vi.fn(),
}));
vi.mock("@/app/lib/data/maps/createPlaceFromPicker", () => ({
  default: createPlaceFromPicker,
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

  it("shows the placement refusal from the catalogue, not the data layer's prose (TD-93, TD-124)", async () => {
    const assignAction = vi.fn().mockResolvedValue({
      ok: false,
      code: "alreadyPlaced",
      errors: {
        zoneId: [{ key: "alreadyAtLocation" }],
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
    // The mutation returns a catalogue key, translated at the render
    // boundary (ADR-0007) — never English prose (ADR-0006).
    expect(
      screen.getByText(/common\.fieldErrors\.alreadyAtLocation/)
    ).toBeInTheDocument();
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

  // SPEC-026: the place the DM meant may not exist yet — creating it here
  // selects it, so saving attaches the entity there without a detour.
  describe("creating the place instead of finding it (SPEC-026)", () => {
    const renderAt = (
      currentZoneId: number | null,
      assignAction = vi.fn().mockResolvedValue({ ok: true })
    ) => {
      render(
        <AssignLocationModal
          isOpen
          onClose={vi.fn()}
          entityId={1}
          currentZoneId={currentZoneId}
          currentPoiId={null}
          currentLocationLabel="Skreebars"
          assignAction={assignAction}
        />
      );
      return assignAction;
    };

    const createNamed = async (name: string) => {
      fireEvent.click(screen.getByText("createPlace"));
      fireEvent.change(screen.getByLabelText("geography.fields.title.label"), {
        target: { value: name },
      });
      fireEvent.click(screen.getByText("create"));
      await waitFor(() => expect(createPlaceFromPicker).toHaveBeenCalled());
    };

    it("defaults the new place's parent to the zone in context", async () => {
      renderAt(5);
      await waitFor(() => expect(fetchZones).toHaveBeenCalled());

      fireEvent.click(screen.getByText("createPlace"));

      expect(screen.getByLabelText("parentLabel")).toHaveValue("5");
    });

    it("selects a new landmark under its zone, so saving attaches the entity to it", async () => {
      createPlaceFromPicker.mockResolvedValue({
        ok: true,
        place: { kind: "poi", id: 90, parentId: 5 },
      });
      const assignAction = renderAt(5);
      await waitFor(() => expect(fetchZones).toHaveBeenCalled());
      fetchZoneLandmarks.mockResolvedValue([
        { id: 9, title: "Locanda del Cinghiale Rosso" },
        { id: 90, title: "Taverna del Gallo Robin" },
      ]);

      await createNamed("Taverna del Gallo Robin");

      await waitFor(() =>
        expect(screen.getByLabelText("poiLabel")).toHaveValue("90")
      );
      fireEvent.click(screen.getByText("save"));
      await waitFor(() =>
        expect(assignAction).toHaveBeenCalledWith({
          id: 1,
          zoneId: 5,
          poiId: 90,
        })
      );
    });

    it("selects a new zone itself, re-reading the zone list", async () => {
      createPlaceFromPicker.mockResolvedValue({
        ok: true,
        place: { kind: "zone", id: 40, parentId: 5 },
      });
      const assignAction = renderAt(5);
      await waitFor(() => expect(fetchZones).toHaveBeenCalledTimes(1));
      fetchZones.mockResolvedValue([
        { id: 5, title: "Skreebars" },
        { id: 40, title: "Skreebars Bassa" },
      ]);

      await createNamed("Skreebars Bassa");

      await waitFor(() => expect(fetchZones).toHaveBeenCalledTimes(2));
      await waitFor(() =>
        expect(screen.getByLabelText("zoneLabel")).toHaveValue("40")
      );
      fireEvent.click(screen.getByText("save"));
      await waitFor(() =>
        expect(assignAction).toHaveBeenCalledWith({
          id: 1,
          zoneId: 40,
          poiId: null,
        })
      );
    });

    it("keeps the selection it had when the creation is cancelled", async () => {
      renderAt(5);
      await waitFor(() => expect(fetchZones).toHaveBeenCalled());

      fireEvent.click(screen.getByText("createPlace"));
      fireEvent.click(screen.getByText("cancel"));

      expect(createPlaceFromPicker).not.toHaveBeenCalled();
      expect(screen.getByLabelText("zoneLabel")).toHaveValue("5");
      expect(screen.getByText("createPlace")).toBeInTheDocument();
    });
  });
});
