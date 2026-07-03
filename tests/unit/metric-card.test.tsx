import { render, screen } from "@testing-library/react";
import { Activity } from "lucide-react";
import { describe, expect, it } from "vitest";
import { MetricCard } from "@/components/design-system/MetricCard";

describe("MetricCard", () => {
  it("renders a dashboard metric with its value and delta", () => {
    render(<MetricCard label="OPD Flow" value="42" delta="+12%" icon={Activity} tone="success" />);

    expect(screen.getByText("OPD Flow")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("+12%")).toBeInTheDocument();
  });
});
