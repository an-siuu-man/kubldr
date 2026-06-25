/**
 * Unit tests for PermutationBrowser
 *
 * Verifies the click-to-edit permutation number feature:
 * 1. Clicking the number reveals a focused input pre-filled with the current 1-based value.
 * 2. Typing a valid number and pressing Enter calls goToPermutation with the 0-based index.
 * 3. An out-of-range number is clamped to the nearest valid bound before jumping.
 * 4. Pressing Escape cancels the edit without calling goToPermutation.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PermutationBrowser from "./PermutationBrowser";

// ─── Mock ScheduleBuilderContext ──────────────────────────────────────────────

const mockGoToPermutation = vi.fn();

const defaultContext = {
  draftSchedule: [{}], // non-empty so the component renders
  permutations: Array.from({ length: 10 }, (_, i) => [{ id: i }]), // 10 permutations
  permutationIndex: 2, // currently showing permutation 3 (1-based)
  isGeneratingPermutations: false,
  nextPermutation: vi.fn(),
  prevPermutation: vi.fn(),
  goToPermutation: mockGoToPermutation,
};

vi.mock("@/contexts/ScheduleBuilderContext", () => ({
  useScheduleBuilder: () => defaultContext,
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("PermutationBrowser – click-to-edit permutation number", () => {
  beforeEach(() => {
    mockGoToPermutation.mockClear();
  });

  it("clicking the current number reveals an input pre-filled with the 1-based value", async () => {
    const user = userEvent.setup();
    render(<PermutationBrowser />);

    // Initially the number is a button showing "3" (permutationIndex 2 + 1)
    const jumpBtn = screen.getByRole("button", {
      name: /jump to a permutation number/i,
    });
    expect(jumpBtn).toHaveTextContent("3");

    await user.click(jumpBtn);

    // After click, the input appears with the current value
    const input = screen.getByRole("textbox", { name: /permutation number/i });
    expect(input).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe("3");
  });

  it("pressing Enter commits the typed value as a 0-based index", async () => {
    const user = userEvent.setup();
    render(<PermutationBrowser />);

    await user.click(
      screen.getByRole("button", { name: /jump to a permutation number/i }),
    );

    const input = screen.getByRole("textbox", { name: /permutation number/i });
    // Clear pre-filled value, type 5, then press Enter
    await user.clear(input);
    await user.type(input, "5");
    await user.keyboard("{Enter}");

    // 1-based 5 → 0-based 4
    expect(mockGoToPermutation).toHaveBeenCalledWith(4);
    // Input is dismissed after commit
    expect(
      screen.queryByRole("textbox", { name: /permutation number/i }),
    ).not.toBeInTheDocument();
  });

  it("clamps an out-of-range number to the highest valid index", async () => {
    const user = userEvent.setup();
    render(<PermutationBrowser />);

    await user.click(
      screen.getByRole("button", { name: /jump to a permutation number/i }),
    );

    const input = screen.getByRole("textbox", { name: /permutation number/i });
    await user.clear(input);
    await user.type(input, "999");
    await user.keyboard("{Enter}");

    // Clamped to total (10) → 0-based 9
    expect(mockGoToPermutation).toHaveBeenCalledWith(9);
  });

  it("pressing Escape cancels the edit without calling goToPermutation", async () => {
    const user = userEvent.setup();
    render(<PermutationBrowser />);

    await user.click(
      screen.getByRole("button", { name: /jump to a permutation number/i }),
    );

    // Verify input is open
    expect(
      screen.getByRole("textbox", { name: /permutation number/i }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");

    // goToPermutation must NOT have been called
    expect(mockGoToPermutation).not.toHaveBeenCalled();
    // Input is gone
    expect(
      screen.queryByRole("textbox", { name: /permutation number/i }),
    ).not.toBeInTheDocument();
  });
});
